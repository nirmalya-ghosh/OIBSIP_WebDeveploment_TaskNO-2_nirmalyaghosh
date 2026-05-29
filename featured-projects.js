const escapeProjectText = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const getProjectIcon = (demoType) => demoType === 'video' ? 'fa-circle-play' : 'fa-globe';

const splitProjectTechStack = (items = []) => items
    .flatMap(item => String(item || '').split(/[\n,•|]/))
    .map(item => item.trim())
    .filter(Boolean);

const createFeaturedProjectCard = (project, options = {}) => {
    const blurred = options.blurAfter && options.index >= options.blurAfter;
    const title = escapeProjectText(project.title);
    const description = escapeProjectText(project.shortDescription);
    const demoLabel = escapeProjectText(project.demoLabel || (project.demoType === 'video' ? 'Watch Video' : 'Live Demo'));
    const imageAlt = escapeProjectText(project.imageAlt || `${project.title} thumbnail`);
    const badge = project.featuredBadge || project.category || (project.isPinned ? 'Pinned' : '');
    const techStack = Array.isArray(project.techStack) ? splitProjectTechStack(project.techStack).slice(0, 8) : [];
    const highlights = Array.isArray(project.highlights) ? project.highlights.slice(0, 2) : [];
    const cardClass = `featured-cms-card${blurred ? ' is-blurred' : ''}`;
    const adminDelete = options.adminMode && project.id ? `
        <button type="button" class="featured-cms-delete" data-delete-project="${escapeProjectText(project.id)}" aria-label="Delete ${title}">
            <i class="fas fa-trash"></i>
            Delete
        </button>
    ` : '';

    return `
        <article class="${cardClass}" data-project-id="${escapeProjectText(project.id || '')}">
            <div class="featured-cms-thumb">
                <img src="${escapeProjectText(project.thumbnailUrl)}" alt="${imageAlt}" loading="lazy">
                <span><i class="fas ${getProjectIcon(project.demoType)}"></i> ${escapeProjectText(project.demoType)}</span>
            </div>
            <div class="featured-cms-body">
                ${badge ? `<div class="featured-cms-kicker">${escapeProjectText(badge)}</div>` : ''}
                <h3>${title}</h3>
                <p>${description}</p>
                ${techStack.length ? `
                    <div class="featured-cms-tech">
                        ${techStack.map(item => `<span>${escapeProjectText(item)}</span>`).join('')}
                    </div>
                ` : ''}
                ${highlights.length ? `
                    <ul class="featured-cms-highlights">
                        ${highlights.map(item => `<li>${escapeProjectText(item)}</li>`).join('')}
                    </ul>
                ` : ''}
                <div class="featured-cms-actions">
                    <a href="${escapeProjectText(project.demoUrl)}" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-up-right-from-square"></i>
                        ${demoLabel}
                    </a>
                    <a href="${escapeProjectText(project.githubUrl)}" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-github"></i>
                        GitHub
                    </a>
                    ${adminDelete}
                </div>
            </div>
        </article>
    `;
};

const renderEmptyProjects = (target, compact = false) => {
    target.innerHTML = `
        <div class="featured-projects-empty">
            <i class="fas fa-folder-plus"></i>
            <strong>No featured projects published yet.</strong>
            <span>${compact ? 'Use the admin project manager to publish your first project.' : 'Published projects will appear here automatically.'}</span>
        </div>
    `;
};

const getPublicConfig = async () => {
    const response = await fetch('/api/public-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Public config unavailable.');
    return response.json();
};

const getAdminContext = async () => {
    const adminSessionToken = sessionStorage.getItem('featuredProjectAdminSession') || '';
    const expiresAt = Number(sessionStorage.getItem('featuredProjectAdminSessionExpiresAt') || 0);
    if (!adminSessionToken || Date.now() >= expiresAt || !window.supabase) return null;

    try {
        const config = await getPublicConfig();
        const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        const { data } = await client.auth.getSession();
        const session = data.session;
        if (!session?.access_token) return null;

        const identityResponse = await fetch('/api/admin-project-session?requireSession=1', {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                'X-Admin-Session': adminSessionToken
            }
        });
        if (!identityResponse.ok) return null;

        return {
            accessToken: session.access_token,
            adminSessionToken
        };
    } catch (_) {
        return null;
    }
};

const attachAdminDeleteHandlers = (target, adminContext, reload) => {
    if (!target || !adminContext) return;

    target.querySelectorAll('[data-delete-project]').forEach(button => {
        button.addEventListener('click', async () => {
            const projectId = button.dataset.deleteProject;
            if (!projectId) return;
            const confirmed = window.confirm('Delete this featured project permanently? An OTP will be sent to the admin email before deletion.');
            if (!confirmed) return;

            button.disabled = true;
            button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sending OTP';

            try {
                const otpResponse = await fetch('/api/admin-featured-projects', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${adminContext.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Admin-Session': adminContext.adminSessionToken
                    },
                    body: JSON.stringify({ action: 'request_delete_otp', projectId })
                });
                const otpResult = await otpResponse.json();
                if (!otpResponse.ok) throw new Error(otpResult?.error || 'Delete OTP could not be sent.');

                const deleteOtp = window.prompt('Enter the 6-digit delete OTP sent to the admin email:');
                if (!deleteOtp) {
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-trash"></i> Delete';
                    return;
                }

                button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifying';
                const response = await fetch(`/api/admin-featured-projects?id=${encodeURIComponent(projectId)}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${adminContext.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Admin-Session': adminContext.adminSessionToken
                    },
                    body: JSON.stringify({ deleteOtp })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result?.error || 'Project could not be deleted.');

                await reload();
            } catch (error) {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-trash"></i> Delete';
                window.alert(error.message || 'Project could not be deleted.');
            }
        });
    });
};

const loadFeaturedProjects = async (adminContextPromise = null) => {
    const homeTarget = document.getElementById('featured-projects-preview');
    const fullTarget = document.getElementById('featured-projects-full');
    if (!homeTarget && !fullTarget) return;

    try {
        const response = await fetch(`/api/featured-projects?limit=24&t=${Date.now()}`, {
            cache: 'no-store'
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || 'Featured projects unavailable.');

        const projects = Array.isArray(result.projects) ? result.projects : [];
        const adminContext = adminContextPromise ? await adminContextPromise : null;
        if (!projects.length) {
            if (homeTarget) renderEmptyProjects(homeTarget);
            if (fullTarget) renderEmptyProjects(fullTarget, true);
            return;
        }

        if (homeTarget) {
            const visibleProjects = projects.slice(0, 6);
            homeTarget.innerHTML = `
                <div class="featured-cms-grid is-preview">
                    ${visibleProjects.map((project, index) => createFeaturedProjectCard(project, { index, blurAfter: 3 })).join('')}
                </div>
                ${projects.length > 3 ? `
                    <a href="featured-projects.html" class="featured-preview-overlay" aria-label="View all featured projects">
                        <span>View More</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                ` : ''}
            `;
        }

        if (fullTarget) {
            fullTarget.innerHTML = `
                <div class="featured-cms-grid">
                    ${projects.map((project, index) => createFeaturedProjectCard(project, { index, adminMode: Boolean(adminContext) })).join('')}
                </div>
            `;
            attachAdminDeleteHandlers(fullTarget, adminContext, () => loadFeaturedProjects(Promise.resolve(adminContext)));
        }
    } catch (error) {
        const message = `
            <div class="featured-projects-empty">
                <i class="fas fa-triangle-exclamation"></i>
                <strong>Featured projects could not load.</strong>
                <span>Please try again in a moment.</span>
            </div>
        `;
        if (homeTarget) homeTarget.innerHTML = message;
        if (fullTarget) fullTarget.innerHTML = message;
    }
};

document.addEventListener('DOMContentLoaded', () => loadFeaturedProjects(getAdminContext()));
