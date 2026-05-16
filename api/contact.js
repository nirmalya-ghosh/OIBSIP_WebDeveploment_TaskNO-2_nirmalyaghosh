const {
    OWNER_EMAIL,
    escapeHtml,
    isValidEmail,
    sendEmail,
    sendJson
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
        const result = await sendEmail({
            to: OWNER_EMAIL,
            replyTo: email,
            subject: `Portfolio Contact: ${subject}`,
            html
        });

        return sendJson(response, 200, { ok: true, id: result.messageId });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Email service unavailable.' });
    }
};
