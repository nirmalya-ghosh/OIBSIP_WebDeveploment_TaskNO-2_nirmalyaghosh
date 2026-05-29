const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OWNER_EMAIL = 'nirmalyaghosh2127@gmail.com';
const FROM_EMAIL = process.env.SMTP_FROM || 'Portfolio Verification <nirmalyaghosh2127@gmail.com>';
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESUME_BUCKET = process.env.RESUME_BUCKET || 'private-resume';
const RESUME_FILE = process.env.RESUME_FILE || 'nirmalya-ghosh-resume.pdf';
const RESUME_SIGNED_URL_SECONDS = Number(process.env.RESUME_SIGNED_URL_SECONDS || 300);
const RESUME_EXTERNAL_URL =
    process.env.RESUME_EXTERNAL_URL || 'https://drive.google.com/file/d/1feNwsLa8S0FORRYVxGUAm2gHBjOvHOMV/preview';
const RESUME_EXTERNAL_OPEN_URL =
    process.env.RESUME_EXTERNAL_OPEN_URL || 'https://drive.google.com/file/d/1feNwsLa8S0FORRYVxGUAm2gHBjOvHOMV/view?usp=sharing';

const applySecurityHeaders = (response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
};

const sendJson = (response, statusCode, payload) => {
    applySecurityHeaders(response);
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(payload));
};

const sendHtml = (response, statusCode, html) => {
    applySecurityHeaders(response);
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

const supabaseStorageFetch = async (path, options = {}) => {
    const { url, key } = ensureSupabaseConfig();
    const response = await fetch(`${url.replace(/\/$/, '')}/storage/v1/${path}`, {
        ...options,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            ...(options.body instanceof Buffer ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Supabase storage request failed.');
    }
    return data;
};

const createResumeSignedUrl = async () => {
    const { url } = ensureSupabaseConfig();
    const encodedPath = RESUME_FILE.split('/').map(encodeURIComponent).join('/');
    const result = await supabaseStorageFetch(`object/sign/${encodeURIComponent(RESUME_BUCKET)}/${encodedPath}`, {
        method: 'POST',
        body: JSON.stringify({
            expiresIn: RESUME_SIGNED_URL_SECONDS
        })
    });
    const signedPath = result.signedURL || result.signedUrl || result.url;
    if (!signedPath) throw new Error('Resume signed URL could not be created.');
    return signedPath.startsWith('http') ? signedPath : `${url.replace(/\/$/, '')}/storage/v1${signedPath}`;
};

const createResumeAccessPayload = async () => {
    if (RESUME_EXTERNAL_URL) {
        return {
            url: RESUME_EXTERNAL_URL,
            openUrl: RESUME_EXTERNAL_OPEN_URL || RESUME_EXTERNAL_URL,
            expiresIn: null
        };
    }

    return {
        url: await createResumeSignedUrl(),
        expiresIn: RESUME_SIGNED_URL_SECONDS
    };
};

let smtpTransporter;

const getSmtpTransporter = () => {
    if (smtpTransporter) return smtpTransporter;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error('SMTP email service is not configured.');
    }

    smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        }
    });
    return smtpTransporter;
};

const sendEmail = async ({ to, subject, html, replyTo }) => {
    const transporter = getSmtpTransporter();
    return transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {})
    });
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
    RESUME_BUCKET,
    RESUME_FILE,
    RESUME_SIGNED_URL_SECONDS,
    createResumeAccessPayload,
    createResumeSignedUrl,
    createToken,
    escapeHtml,
    applySecurityHeaders,
    getBaseUrl,
    hashOtp,
    isValidEmail,
    sendEmail,
    sendHtml,
    sendJson,
    supabaseFetch,
    supabaseStorageFetch,
    verifyTurnstile
};
