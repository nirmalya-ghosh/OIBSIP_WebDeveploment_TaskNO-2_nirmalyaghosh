const crypto = require('crypto');

const OWNER_EMAIL = 'nirmalyaghosh2127@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Portfolio Access <onboarding@resend.dev>';
const RESUME_URL = 'https://drive.google.com/file/d/11PAPOiUQRf-lMziJCz0ROhQoja_QhBSx/view?usp=sharing';
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const sendJson = (response, statusCode, payload) => {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(payload));
};

const sendHtml = (response, statusCode, html) => {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(html);
};

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashOtp = (otp = '') =>
    crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

const createToken = () => crypto.randomBytes(32).toString('base64url');

const getBaseUrl = (request) => {
    const proto = request.headers['x-forwarded-proto'] || 'https';
    const host = request.headers.host || 'nirmalya-ghosh.vercel.app';
    return `${proto}://${host}`;
};

const getSupabaseConfig = () => ({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
});

const ensureSupabaseConfig = () => {
    const config = getSupabaseConfig();
    if (!config.url || !config.key) {
        throw new Error('Supabase is not configured.');
    }
    return config;
};

const supabaseFetch = async (path, options = {}) => {
    const { url, key } = ensureSupabaseConfig();
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Supabase request failed.');
    }
    return data;
};

const sendEmail = async ({ to, subject, html, replyTo }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('Email service is not configured.');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to,
            subject,
            html,
            ...(replyTo ? { reply_to: replyTo } : {})
        })
    });

    const result = await response.json();
    if (!response.ok) {
        const message = result?.message || 'Email could not be sent.';
        if (
            message.includes('onboarding@resend.dev') ||
            message.includes('resend.dev') ||
            message.includes('You can only send testing emails')
        ) {
            throw new Error('Email sending is in Resend test mode. Verify a domain in Resend and set RESEND_FROM_EMAIL in Vercel to send OTPs to any address.');
        }
        throw new Error(message);
    }
    return result;
};

const verifyTurnstile = async (request, token) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) throw new Error('Turnstile secret is not configured.');
    if (!token) return false;

    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);

    const clientIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim();
    if (clientIp) formData.append('remoteip', clientIp);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
    });
    const verification = await response.json();
    return Boolean(verification.success);
};

module.exports = {
    OWNER_EMAIL,
    OTP_EXPIRY_MS,
    RESUME_URL,
    createToken,
    escapeHtml,
    getBaseUrl,
    hashOtp,
    isValidEmail,
    sendEmail,
    sendHtml,
    sendJson,
    supabaseFetch,
    verifyTurnstile
};
