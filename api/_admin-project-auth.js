const crypto = require('crypto');

const ADMIN_EMAIL = (process.env.FEATURED_PROJECTS_ADMIN_EMAIL || 'nirmalyaghosh2127@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.FEATURED_PROJECTS_ADMIN_PASSWORD || process.env.ADMIN_PROJECTS_PASSWORD;

const getSigningSecret = () =>
    process.env.ADMIN_PROJECTS_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.FEATURED_PROJECTS_ADMIN_PASSWORD ||
    '';

const hasSecureSessionSecret = () => Boolean(getSigningSecret());

const verifyPassword = (password = '') => {
    if (!ADMIN_PASSWORD) return false;
    const actual = Buffer.from(String(ADMIN_PASSWORD));
    const provided = Buffer.from(String(password));
    return actual.length === provided.length && crypto.timingSafeEqual(actual, provided);
};

const getBearerToken = (request) => {
    const header = request.headers.authorization || request.headers.Authorization || '';
    const match = String(header).match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : '';
};

const verifySupabaseAdmin = async (token) => {
    if (!token) return null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !key) throw new Error('Supabase admin verification is not configured.');

    const authResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'GET',
        headers: {
            apikey: key,
            Authorization: `Bearer ${token}`
        }
    });

    const user = await authResponse.json().catch(() => null);
    if (!authResponse.ok || !user?.email) return null;
    return String(user.email).toLowerCase() === ADMIN_EMAIL ? user : null;
};

const signSession = ({ email, expiresAt }) => {
    const signingSecret = getSigningSecret();
    if (!signingSecret) throw new Error('Admin session signing is not configured.');

    const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', signingSecret)
        .update(payload)
        .digest('base64url');
    return `${payload}.${signature}`;
};

const verifySession = (token = '', email = '') => {
    const signingSecret = getSigningSecret();
    if (!signingSecret) return false;

    const [payload, signature] = String(token).split('.');
    if (!payload || !signature) return false;

    const expected = crypto
        .createHmac('sha256', signingSecret)
        .update(payload)
        .digest('base64url');

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
        return false;
    }

    let parsed;
    try {
        parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch (_) {
        return false;
    }

    if (!parsed?.email || !parsed?.expiresAt) return false;
    if (String(parsed.email).toLowerCase() !== String(email).toLowerCase()) return false;
    return Date.now() < Number(parsed.expiresAt);
};

module.exports = {
    ADMIN_EMAIL,
    getBearerToken,
    hasSecureSessionSecret,
    signSession,
    verifyPassword,
    verifySession,
    verifySupabaseAdmin
};
