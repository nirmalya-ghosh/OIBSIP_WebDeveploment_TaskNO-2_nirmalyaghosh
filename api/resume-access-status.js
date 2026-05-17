const {
    createResumeAccessPayload,
    isValidEmail,
    sendJson,
    supabaseFetch
} = require('./_resume-access');

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let payload = request.body || {};
    if (!payload || typeof payload === 'string') {
        try {
            payload = typeof payload === 'string' ? JSON.parse(payload) : {};
        } catch (error) {
            return sendJson(response, 400, { error: 'Invalid request body.' });
        }
    }

    const email = String(payload.email || '').trim().toLowerCase();
    const requestId = String(payload.requestId || '').trim();

    if (!requestId || !isValidEmail(email)) {
        return sendJson(response, 400, { error: 'Invalid status request.' });
    }

    try {
        const rows = await supabaseFetch(
            `resume_access_requests?id=eq.${encodeURIComponent(requestId)}&email=eq.${encodeURIComponent(email)}&select=status`,
            { method: 'GET' }
        );
        const record = rows?.[0];

        if (!record) {
            return sendJson(response, 404, { error: 'Access request not found.' });
        }

        if (record.status === 'approved') {
            return sendJson(response, 200, {
                status: 'approved',
                ...(await createResumeAccessPayload())
            });
        }

        if (record.status === 'rejected') {
            return sendJson(response, 200, {
                status: 'rejected',
                message: 'Your resume access request was not approved.'
            });
        }

        return sendJson(response, 200, {
            status: record.status
        });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Status check failed.' });
    }
};
