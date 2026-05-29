const { sendJson } = require('./_resume-access');
const {
    getBearerToken,
    signSession,
    verifySession,
    verifyPassword,
    verifySupabaseAdmin
} = require('./_admin-project-auth');

const getBody = (request) => {
    if (request.body && typeof request.body === 'object') return request.body;
    if (typeof request.body === 'string') return JSON.parse(request.body || '{}');
    return {};
};

module.exports = async (request, response) => {
    if (!['GET', 'POST'].includes(request.method)) {
        response.setHeader('Allow', 'GET, POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let adminUser = null;
    try {
        adminUser = await verifySupabaseAdmin(getBearerToken(request));
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Admin identity could not be verified.' });
    }

    if (!adminUser) {
        return sendJson(response, 401, { error: 'Please sign in with the verified admin account first.' });
    }

    if (request.method === 'GET') {
        const url = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
        if (url.searchParams.get('requireSession') === '1') {
            const adminSessionToken = request.headers['x-admin-session'] || request.headers['X-Admin-Session'] || '';
            if (!verifySession(adminSessionToken, adminUser.email)) {
                return sendJson(response, 401, { error: 'Please complete admin verification before managing projects.' });
            }
        }

        return sendJson(response, 200, { ok: true });
    }

    let payload;
    try {
        payload = getBody(request);
    } catch (_) {
        return sendJson(response, 400, { error: 'Invalid verification payload.' });
    }

    if (!verifyPassword(payload.adminPassword)) {
        return sendJson(response, 401, { error: 'Admin password verification failed.' });
    }

    const expiresAt = Date.now() + 30 * 60 * 1000;
    try {
        return sendJson(response, 200, {
            ok: true,
            adminSessionToken: signSession({ email: adminUser.email, expiresAt }),
            expiresAt
        });
    } catch (error) {
        return sendJson(response, 500, { error: error.message || 'Admin session could not be created.' });
    }
};
