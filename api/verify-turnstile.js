const DOCUMENTS = {
    resume: 'https://drive.google.com/file/d/11PAPOiUQRf-lMziJCz0ROhQoja_QhBSx/view?usp=sharing',
    certifications: 'https://little-cake-29a6.nirmalyaghosh2127.workers.dev/'
};

const sendJson = (response, statusCode, payload) => {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(payload));
};

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        return sendJson(response, 500, { error: 'Turnstile secret is not configured.' });
    }

    let payload = request.body || {};
    if (!payload || typeof payload === 'string') {
        try {
            payload = typeof payload === 'string' ? JSON.parse(payload) : {};
        } catch (error) {
            return sendJson(response, 400, { error: 'Invalid request body.' });
        }
    }

    const { token, documentId } = payload;
    const documentUrl = DOCUMENTS[documentId];

    if (!token || !documentUrl) {
        return sendJson(response, 400, { error: 'Invalid verification request.' });
    }

    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);

    const clientIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim();
    if (clientIp) formData.append('remoteip', clientIp);

    try {
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        const verification = await verifyResponse.json();

        if (!verification.success) {
            return sendJson(response, 403, {
                error: 'Cloudflare verification failed. Please try again.',
                codes: verification['error-codes'] || []
            });
        }

        return sendJson(response, 200, { url: documentUrl });
    } catch (error) {
        return sendJson(response, 502, { error: 'Verification service unavailable.' });
    }
};
