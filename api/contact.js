const CONTACT_RECIPIENT = 'nirmalyaghosh2127@gmail.com';
const FROM_EMAIL = 'Portfolio Contact <onboarding@resend.dev>';

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

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return sendJson(response, 500, { error: 'Email service is not configured.' });
    }

    let payload = request.body || {};
    if (!payload || typeof payload === 'string') {
        try {
            payload = typeof payload === 'string' ? JSON.parse(payload) : {};
        } catch (error) {
            return sendJson(response, 400, { error: 'Invalid request body.' });
        }
    }

    const name = String(payload.name || '').trim().slice(0, 120);
    const email = String(payload.email || '').trim().slice(0, 180);
    const subject = String(payload.subject || '').trim().slice(0, 160);
    const message = String(payload.message || '').trim().slice(0, 4000);

    if (!name || !email || !subject || !message) {
        return sendJson(response, 400, { error: 'Please fill in every field.' });
    }

    if (!isValidEmail(email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address.' });
    }

    const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>New portfolio message</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
            <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
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
                to: CONTACT_RECIPIENT,
                reply_to: email,
                subject: `Portfolio Contact: ${subject}`,
                html
            })
        });

        const result = await resendResponse.json();
        if (!resendResponse.ok) {
            return sendJson(response, 502, {
                error: result?.message || 'Email could not be sent.'
            });
        }

        return sendJson(response, 200, { ok: true, id: result.id });
    } catch (error) {
        return sendJson(response, 502, { error: 'Email service unavailable.' });
    }
};
