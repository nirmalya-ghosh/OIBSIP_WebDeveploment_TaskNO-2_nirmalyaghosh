const crypto = require('crypto');

const FROM_EMAIL = 'Portfolio Access <onboarding@resend.dev>';
const OTP_EXPIRY_MS = 10 * 60 * 1000;
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

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getEmailDomain = (email = '') => email.split('@').pop().toLowerCase();

const isCompanyEmail = (email = '') => {
    if (!isValidEmail(email)) return false;
    const domain = getEmailDomain(email);
    return domain && !PERSONAL_EMAIL_DOMAINS.has(domain);
};

const base64url = (value) => Buffer.from(value).toString('base64url');

const sign = (value, secret) =>
    crypto.createHmac('sha256', secret).update(value).digest('base64url');

const createOtpToken = ({ email, documentId, otp, expiresAt }, secret) => {
    const body = base64url(JSON.stringify({
        email,
        documentId,
        otpHash: crypto.createHash('sha256').update(otp).digest('hex'),
        expiresAt
    }));
    return `${body}.${sign(body, secret)}`;
};

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const signingSecret = process.env.OTP_SIGNING_SECRET || process.env.RESEND_API_KEY;

    if (!apiKey || !signingSecret) {
        return sendJson(response, 500, { error: 'Email verification is not configured.' });
    }

    let payload = request.body || {};
    if (!payload || typeof payload === 'string') {
        try {
            payload = typeof payload === 'string' ? JSON.parse(payload) : {};
        } catch (error) {
            return sendJson(response, 400, { error: 'Invalid request body.' });
        }
    }

    const email = String(payload.email || '').trim().toLowerCase().slice(0, 180);
    const documentId = String(payload.documentId || '').trim();

    if (documentId !== 'resume') {
        return sendJson(response, 400, { error: 'OTP verification is only required for resume access.' });
    }

    if (!isCompanyEmail(email)) {
        return sendJson(response, 400, { error: 'Please use a valid company email address.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    const otpToken = createOtpToken({ email, documentId, otp, expiresAt }, signingSecret);

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>Resume access verification</h2>
            <p>Your verification code is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${escapeHtml(otp)}</p>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request Nirmalya Ghosh's resume, you can ignore this email.</p>
        </div>
    `;

    try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: email,
                subject: 'Your resume access OTP',
                html
            })
        });

        const result = await resendResponse.json();
        if (!resendResponse.ok) {
            return sendJson(response, 502, {
                error: result?.message || 'OTP email could not be sent.'
            });
        }

        return sendJson(response, 200, {
            ok: true,
            otpToken,
            expiresAt
        });
    } catch (error) {
        return sendJson(response, 502, { error: 'Email service unavailable.' });
    }
};
