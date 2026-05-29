const crypto = require('crypto');

const {
    OWNER_EMAIL,
    createToken,
    escapeHtml,
    hashOtp,
    sendEmail,
    sendJson,
    supabaseFetch,
    supabaseStorageFetch
} = require('./_resume-access');
const {
    getBearerToken,
    verifySession,
    verifySupabaseAdmin
} = require('./_admin-project-auth');

const THUMBNAIL_BUCKET = process.env.FEATURED_PROJECTS_BUCKET || 'featured-project-thumbnails';
const DELETE_OTP_EXPIRY_MS = 5 * 60 * 1000;

const isAllowedMutationOrigin = (request) => {
    const origin = request.headers.origin || request.headers.Origin || '';
    if (!origin) return true;

    try {
        const originUrl = new URL(origin);
        const requestHost = request.headers['x-forwarded-host'] || request.headers.host || '';
        const configuredHost = process.env.SITE_URL
            ? new URL(process.env.SITE_URL).host
            : 'nirmalya-ghosh.vercel.app';

        return [requestHost, configuredHost].filter(Boolean).includes(originUrl.host);
    } catch (_) {
        return false;
    }
};

const isValidUrl = (value = '') => {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
        return false;
    }
};

const getBody = (request) => {
    if (request.body && typeof request.body === 'object') return request.body;
    if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
    return {};
};

const decodeImage = (dataUrl = '') => {
    const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=]+)$/i);
    if (!match) return null;
    const contentType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    return {
        contentType,
        extension: contentType.split('/')[1].replace('jpeg', 'jpg'),
        buffer: Buffer.from(match[2], 'base64')
    };
};

const cleanText = (value = '', max = 240) => String(value || '').trim().slice(0, max);

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const getDeleteOtpDocument = (projectId) => `featured_project_delete:${projectId}`;

const cleanList = (value, maxItems = 8, maxLength = 42) => {
    const source = Array.isArray(value)
        ? value
        : String(value || '').split(/[\n,•|]/);

    return source
        .map(item => cleanText(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);
};

const slugify = (value = '') => cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

const isSchemaFieldError = (error) =>
    /column .* does not exist|schema cache|Could not find/i.test(error?.message || '');

const verifyAdminRequest = async (request) => {
    if (!isAllowedMutationOrigin(request)) {
        return { error: 'Project management requests must come from the admin website.', status: 403 };
    }

    let adminUser = null;
    try {
        adminUser = await verifySupabaseAdmin(getBearerToken(request));
    } catch (error) {
        return { error: error.message || 'Admin identity could not be verified.', status: 502 };
    }

    if (!adminUser) {
        return { error: 'Please sign in with the verified admin account first.', status: 401 };
    }

    const adminSessionToken = request.headers['x-admin-session'] || request.headers['X-Admin-Session'] || '';
    if (!verifySession(adminSessionToken, adminUser.email)) {
        return { error: 'Please complete admin verification before managing projects.', status: 401 };
    }

    return { adminUser };
};

const insertProjectRecord = async (projectRecord) => {
    const withRepresentation = {
        method: 'POST',
        headers: { Prefer: 'return=representation' }
    };

    const attemptInsert = (record) => supabaseFetch('featured_projects', {
        ...withRepresentation,
        body: JSON.stringify(record)
    });

    try {
        const [project] = await attemptInsert(projectRecord);
        return { project, usedFallback: false };
    } catch (error) {
        if (/duplicate key|unique constraint|23505/i.test(error.message || '') && projectRecord.slug) {
            const retryRecord = {
                ...projectRecord,
                slug: `${projectRecord.slug}-${crypto.randomBytes(3).toString('hex')}`.slice(0, 96)
            };
            const [project] = await attemptInsert(retryRecord);
            return { project, usedFallback: false };
        }

        if (!isSchemaFieldError(error)) throw error;

        const coreRecord = {
            title: projectRecord.title,
            short_description: projectRecord.short_description,
            thumbnail_url: projectRecord.thumbnail_url,
            thumbnail_path: projectRecord.thumbnail_path,
            demo_type: projectRecord.demo_type,
            demo_url: projectRecord.demo_url,
            github_url: projectRecord.github_url,
            display_order: projectRecord.display_order,
            published: projectRecord.published
        };
        const [project] = await attemptInsert(coreRecord);
        return { project, usedFallback: true };
    }
};

const requestDeleteOtp = async (request, response, payload) => {
    const auth = await verifyAdminRequest(request);
    if (auth.error) return sendJson(response, auth.status, { error: auth.error });

    const projectId = cleanText(payload.projectId, 80);
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
        return sendJson(response, 400, { error: 'A valid project id is required.' });
    }

    try {
        const [project] = await supabaseFetch(
            `featured_projects?id=eq.${encodeURIComponent(projectId)}&select=id,title&limit=1`,
            { method: 'GET' }
        );
        if (!project) return sendJson(response, 404, { error: 'Project was not found or was already deleted.' });

        const otp = createOtp();
        const expiresAt = new Date(Date.now() + DELETE_OTP_EXPIRY_MS).toISOString();

        await supabaseFetch('resume_access_requests', {
            method: 'POST',
            body: JSON.stringify({
                email: auth.adminUser.email || OWNER_EMAIL,
                status: 'otp_sent',
                otp_hash: hashOtp(otp),
                otp_expires_at: expiresAt,
                approval_token: createToken(),
                requested_document: getDeleteOtpDocument(project.id),
                requested_at: new Date().toISOString()
            })
        });

        await sendEmail({
            to: auth.adminUser.email || OWNER_EMAIL,
            subject: `Delete OTP for ${project.title}`,
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                    <h2>Featured project delete OTP</h2>
                    <p>You requested deletion for <strong>${escapeHtml(project.title)}</strong>.</p>
                    <p>Your OTP is:</p>
                    <p style="font-size:28px;font-weight:800;letter-spacing:6px">${otp}</p>
                    <p>This OTP expires in 5 minutes. If you did not request this, ignore this email.</p>
                </div>
            `
        });

        return sendJson(response, 200, {
            ok: true,
            expiresAt,
            message: 'Delete OTP sent to the admin email.'
        });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Delete OTP could not be sent.' });
    }
};

const deleteProject = async (request, response) => {
    const auth = await verifyAdminRequest(request);
    if (auth.error) return sendJson(response, auth.status, { error: auth.error });

    const url = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
    const id = cleanText(url.searchParams.get('id'), 80);
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
        return sendJson(response, 400, { error: 'A valid project id is required for deletion.' });
    }

    let payload;
    try {
        payload = getBody(request);
    } catch (_) {
        return sendJson(response, 400, { error: 'Invalid delete verification payload.' });
    }

    const otp = cleanText(payload.deleteOtp, 12).replace(/\s+/g, '');
    if (!/^\d{6}$/.test(otp)) {
        return sendJson(response, 400, { error: 'Enter the 6-digit delete OTP sent to the admin email.' });
    }

    try {
        const [project] = await supabaseFetch(
            `featured_projects?id=eq.${encodeURIComponent(id)}&select=id,thumbnail_path,title`,
            { method: 'GET' }
        );
        if (!project) return sendJson(response, 404, { error: 'Project was not found or was already deleted.' });

        const now = new Date().toISOString();
        const [otpRecord] = await supabaseFetch(
            `resume_access_requests?email=eq.${encodeURIComponent(auth.adminUser.email)}&requested_document=eq.${encodeURIComponent(getDeleteOtpDocument(id))}&status=eq.otp_sent&otp_expires_at=gt.${encodeURIComponent(now)}&select=id,otp_hash&order=created_at.desc&limit=1`,
            { method: 'GET' }
        );
        if (!otpRecord || otpRecord.otp_hash !== hashOtp(otp)) {
            return sendJson(response, 401, { error: 'Delete OTP is invalid or expired.' });
        }

        await supabaseFetch(`resume_access_requests?id=eq.${encodeURIComponent(otpRecord.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'expired', decided_at: now })
        });

        await supabaseFetch(`featured_projects?id=eq.${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        if (project.thumbnail_path) {
            await supabaseStorageFetch(`object/${encodeURIComponent(THUMBNAIL_BUCKET)}/${project.thumbnail_path}`, {
                method: 'DELETE'
            }).catch(() => null);
        }

        return sendJson(response, 200, { ok: true, deletedId: id });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Project could not be deleted.' });
    }
};

module.exports = async (request, response) => {
    if (request.method === 'DELETE') {
        return deleteProject(request, response);
    }

    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST, DELETE');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let payload;
    try {
        payload = getBody(request);
    } catch (error) {
        return sendJson(response, 400, { error: 'Invalid project payload.' });
    }

    if (payload.action === 'request_delete_otp') {
        return requestDeleteOtp(request, response, payload);
    }

    const auth = await verifyAdminRequest(request);
    if (auth.error) return sendJson(response, auth.status, { error: auth.error });

    const title = String(payload.title || '').trim().slice(0, 140);
    const shortDescription = String(payload.shortDescription || '').trim().slice(0, 520);
    const demoType = String(payload.demoType || '').trim();
    const demoUrl = String(payload.demoUrl || '').trim();
    const githubUrl = String(payload.githubUrl || '').trim();
    const displayOrder = Number.isFinite(Number(payload.displayOrder)) ? Math.round(Number(payload.displayOrder)) : 100;
    const published = payload.published !== false;
    const image = decodeImage(payload.thumbnailDataUrl);
    const category = cleanText(payload.category, 80);
    const techStack = cleanList(payload.techStack, 10, 32);
    const projectStatus = ['completed', 'in_progress', 'case_study', 'archived'].includes(payload.projectStatus)
        ? payload.projectStatus
        : 'completed';
    const projectRole = cleanText(payload.projectRole, 120);
    const problemSolved = cleanText(payload.problemSolved, 700);
    const highlights = cleanList(payload.highlights, 5, 120);
    const imageAlt = cleanText(payload.imageAlt, 180) || `${title} project thumbnail`;
    const demoLabel = cleanText(payload.demoLabel, 40) || (demoType === 'video' ? 'Watch Video' : 'Live Demo');
    const featuredBadge = cleanText(payload.featuredBadge, 40);
    const isPinned = payload.isPinned === true;
    const projectDate = /^\d{4}-\d{2}-\d{2}$/.test(String(payload.projectDate || '')) ? payload.projectDate : null;
    const slug = slugify(payload.slug || title);

    if (!title || !shortDescription || !['website', 'video'].includes(demoType)) {
        return sendJson(response, 400, { error: 'Please provide title, description, and a valid demo type.' });
    }

    if (!isValidUrl(demoUrl) || !isValidUrl(githubUrl)) {
        return sendJson(response, 400, { error: 'Please provide valid demo and GitHub links.' });
    }

    if (!image || image.buffer.length > 4 * 1024 * 1024) {
        return sendJson(response, 400, { error: 'Please upload a cropped thumbnail under 4MB.' });
    }

    const objectPath = `projects/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${image.extension}`;

    try {
        await supabaseStorageFetch(`object/${encodeURIComponent(THUMBNAIL_BUCKET)}/${objectPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': image.contentType,
                'x-upsert': 'false'
            },
            body: image.buffer
        });

        const supabaseUrl = process.env.SUPABASE_URL;
        const thumbnailUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(THUMBNAIL_BUCKET)}/${objectPath}`;

        const projectRecord = {
            title,
            short_description: shortDescription,
            thumbnail_url: thumbnailUrl,
            thumbnail_path: objectPath,
            demo_type: demoType,
            demo_url: demoUrl,
            github_url: githubUrl,
            display_order: displayOrder,
            published,
            category: category || null,
            tech_stack: techStack,
            project_status: projectStatus,
            project_role: projectRole || null,
            problem_solved: problemSolved || null,
            highlights,
            image_alt: imageAlt,
            demo_label: demoLabel,
            featured_badge: featuredBadge || null,
            project_date: projectDate,
            slug: slug || null,
            is_pinned: isPinned
        };

        const { project, usedFallback } = await insertProjectRecord(projectRecord);

        return sendJson(response, 200, {
            ok: true,
            project,
            warning: usedFallback
                ? 'Project saved with core fields. Run the updated Supabase migration to enable categories, tech stack, badges, dates, and pinned ordering.'
                : ''
        });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Project could not be saved.' });
    }
};
