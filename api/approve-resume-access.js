const {
    RESUME_URL,
    escapeHtml,
    sendEmail,
    sendHtml,
    supabaseFetch
} = require('./_resume-access');

module.exports = async (request, response) => {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return sendHtml(response, 405, '<h1>Method not allowed</h1>');
    }

    const token = String(request.query?.token || '').trim();
    if (!token) {
        return sendHtml(response, 400, '<h1>Invalid approval link</h1>');
    }

    try {
        const rows = await supabaseFetch(
            `resume_access_requests?approval_token=eq.${encodeURIComponent(token)}&select=*`,
            { method: 'GET' }
        );
        const record = rows?.[0];

        if (!record) {
            return sendHtml(response, 404, '<h1>Request not found</h1>');
        }

        if (record.status === 'approved') {
            return sendHtml(response, 200, '<h1>Already approved</h1><p>The resume link was already sent.</p>');
        }

        if (record.status !== 'pending') {
            return sendHtml(response, 409, `<h1>Cannot approve</h1><p>This request is currently ${escapeHtml(record.status)}.</p>`);
        }

        await supabaseFetch(`resume_access_requests?id=eq.${encodeURIComponent(record.id)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
                status: 'approved',
                decided_at: new Date().toISOString()
            })
        });

        await sendEmail({
            to: record.email,
            subject: 'Resume access approved',
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                    <h2>Resume access approved</h2>
                    <p>Your request to view Nirmalya Ghosh's resume has been approved.</p>
                    <p><a href="${RESUME_URL}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open Resume</a></p>
                </div>
            `
        });

        return sendHtml(response, 200, `<h1>Approved</h1><p>Resume link sent to ${escapeHtml(record.email)}.</p>`);
    } catch (error) {
        return sendHtml(response, 500, `<h1>Approval failed</h1><p>${escapeHtml(error.message || 'Please try again.')}</p>`);
    }
};
