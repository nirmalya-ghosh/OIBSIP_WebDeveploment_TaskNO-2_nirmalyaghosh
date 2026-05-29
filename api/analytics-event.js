const crypto = require('crypto');

const {
    sendJson,
    supabaseFetch
} = require('./_resume-access');

const allowedEvents = new Set([
    'page_view',
    'section_view',
    'session_engagement',
    'link_click',
    'outbound_link_click',
    'anchor_link_click',
    'button_click',
    'contact_link_click',
    'project_link_click',
    'document_gate_open',
    'resume_otp_requested',
    'resume_access_pending_approval',
    'resume_access_approved',
    'contact_form_submit_attempt',
    'contact_form_submit_success',
    'contact_form_submit_error',
    'assistant_prompt_click',
    'assistant_question_submitted'
]);

const clamp = (value = '', max = 500) => String(value || '').trim().slice(0, max);

const toInt = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : null;
};

const hashValue = (value = '') => {
    if (!value) return null;
    const salt = process.env.ANALYTICS_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'portfolio-analytics';
    return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
};

const getClientIp = (request) => {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
    return request.headers['x-real-ip'] || request.socket?.remoteAddress || '';
};

const getJsonBody = async (request) => {
    if (Buffer.isBuffer(request.body)) return JSON.parse(request.body.toString('utf8') || '{}');
    if (request.body && typeof request.body === 'object') return request.body;
    if (typeof request.body === 'string') return JSON.parse(request.body || '{}');

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    return raw ? JSON.parse(raw) : {};
};

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    let payload;
    try {
        payload = await getJsonBody(request);
    } catch (error) {
        return sendJson(response, 400, { error: 'Invalid analytics payload.' });
    }

    const eventName = clamp(payload.eventName, 80);
    if (!allowedEvents.has(eventName)) {
        return sendJson(response, 400, { error: 'Unsupported analytics event.' });
    }

    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    const clientIp = getClientIp(request);

    const record = {
        event_name: eventName,
        visitor_id: hashValue(clamp(payload.visitorId, 120)),
        session_id: clamp(payload.sessionId, 120),
        page_path: clamp(payload.pagePath, 500),
        page_title: clamp(payload.pageTitle, 300),
        referrer: clamp(payload.referrer, 1000),
        device_type: clamp(payload.deviceType, 60),
        browser: clamp(payload.browser, 80),
        viewport_width: toInt(payload.viewportWidth),
        viewport_height: toInt(payload.viewportHeight),
        timezone: clamp(payload.timezone, 120),
        language: clamp(payload.language, 80),
        country_code: clamp(request.headers['x-vercel-ip-country'], 12),
        region: clamp(request.headers['x-vercel-ip-country-region'], 120),
        city: clamp(request.headers['x-vercel-ip-city'], 180),
        ip_hash: hashValue(clientIp),
        user_agent: clamp(request.headers['user-agent'], 1000),
        metadata
    };

    try {
        await supabaseFetch('portfolio_analytics_events', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify(record)
        });

        return sendJson(response, 200, { ok: true });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Analytics could not be stored.' });
    }
};
