const crypto = require('crypto');

const DOCUMENTS = {
    resume: 'https://drive.google.com/file/d/11PAPOiUQRf-lMziJCz0ROhQoja_QhBSx/view?usp=sharing',
    certifications: 'https://little-cake-29a6.nirmalyaghosh2127.workers.dev/'
};

const PERSONAL_EMAIL_DOMAINS = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'ymail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'pm.me',
    'zoho.com',
    'mail.com',
    'gmx.com',
    'gmx.net',
    'yandex.com',
    'rediffmail.com'
]);

const sendJson = (response, statusCode, payload) => {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(payload));
};

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getEmailDomain = (email = '') => email.split('@').pop().toLowerCase();

const isCompanyEmail = (email = '') => {
    if (!isValidEmail(email)) return false;
    const domain = getEmailDomain(email);
    return domain && !PERSONAL_EMAIL_DOMAINS.has(domain);
};

const sign = (value, secret) =>
    crypto.createHmac('sha256', secret).update(value).digest('base64url');

const verifyOtpToken = ({ email, documentId, otp, otpToken }, secret) => {
    if (!email || !documentId || !otp || !otpToken || !secret) return false;

    const [body, signature] = String(otpToken).split('.');
    if (!body || !signature) return false;

    const expectedSignature = sign(body, secret);
    if (
        expectedSignature.length !== signature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    ) {
        return false;
    }

    let payload;
    try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch (error) {
        return false;
    }

    const otpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    return (
        payload.email === email &&
        payload.documentId === documentId &&
        payload.otpHash === otpHash &&
        Number(payload.expiresAt) > Date.now()
    );
};

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    const otpSecret = process.env.OTP_SIGNING_SECRET || process.env.RESEND_API_KEY;
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

    if (documentId === 'resume') {
        const email = String(payload.email || '').trim().toLowerCase();
        const otp = String(payload.otp || '').trim();
        const otpToken = String(payload.otpToken || '');

        if (!isCompanyEmail(email)) {
            return sendJson(response, 400, { error: 'Please use a valid company email address.' });
        }

        if (!verifyOtpToken({ email, documentId, otp, otpToken }, otpSecret)) {
            return sendJson(response, 403, { error: 'Email OTP is invalid or expired.' });
        }
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
