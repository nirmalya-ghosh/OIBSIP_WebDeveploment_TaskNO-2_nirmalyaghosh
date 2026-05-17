const {
    OWNER_EMAIL,
    escapeHtml,
    getBaseUrl,
    hashOtp,
    isValidEmail,
    sendEmail,
    sendJson,
    supabaseFetch,
    verifyTurnstile
} = require('./_resume-access');

const DOCUMENTS = {
    certifications: 'https://little-cake-29a6.nirmalyaghosh2127.workers.dev/'
};

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

    const { token, documentId } = payload;

    try {
        const turnstileOk = await verifyTurnstile(request, token);
        if (!turnstileOk) {
            return sendJson(response, 403, { error: 'Cloudflare verification failed. Please try again.' });
        }

        if (documentId === 'certifications') {
            return sendJson(response, 200, { url: DOCUMENTS.certifications });
        }

        if (documentId !== 'resume') {
            return sendJson(response, 400, { error: 'Invalid verification request.' });
        }

        const email = String(payload.email || '').trim().toLowerCase();
        const otp = String(payload.otp || '').trim();
        const requestId = String(payload.requestId || '').trim();

        if (!isValidEmail(email)) {
            return sendJson(response, 400, { error: 'Please enter a valid email address.' });
        }

        if (!requestId || !/^\d{6}$/.test(otp)) {
            return sendJson(response, 400, { error: 'Please request the OTP and enter the 6-digit code.' });
        }

        const rows = await supabaseFetch(
            `resume_access_requests?id=eq.${encodeURIComponent(requestId)}&email=eq.${encodeURIComponent(email)}&status=eq.otp_sent&select=*`,
            { method: 'GET' }
        );
        const record = rows?.[0];

        if (!record) {
            return sendJson(response, 403, { error: 'OTP request was not found. Please request a new OTP.' });
        }

        if (new Date(record.otp_expires_at).getTime() < Date.now()) {
            await supabaseFetch(`resume_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ status: 'expired' })
            });
            return sendJson(response, 403, { error: 'OTP expired. Please request a new OTP.' });
        }

        if (record.otp_hash !== hashOtp(otp)) {
            return sendJson(response, 403, { error: 'Invalid OTP. Please check the code and try again.' });
        }

        await supabaseFetch(`resume_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
                status: 'pending',
                requested_at: new Date().toISOString()
            })
        });

        const baseUrl = getBaseUrl(request);
        const approveUrl = `${baseUrl}/api/approve-resume-access?token=${encodeURIComponent(record.approval_token)}`;
        const rejectUrl = `${baseUrl}/api/reject-resume-access?token=${encodeURIComponent(record.approval_token)}`;
        const ownerHtml = `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <h2>Resume access request</h2>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p>The requester verified this email with OTP and completed Cloudflare.</p>
                <p>
                    <a href="${approveUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;margin-right:8px">Approve</a>
                    <a href="${rejectUrl}" style="display:inline-block;background:#991b1b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reject</a>
                </p>
            </div>
        `;

        await sendEmail({
            to: OWNER_EMAIL,
            subject: `Resume access request from ${email}`,
            html: ownerHtml,
            replyTo: email
        });

        return sendJson(response, 200, {
            ok: true,
            pendingApproval: true,
            message: 'Your email is verified. Keep this window open; the resume will open after approval.'
        });
    } catch (error) {
        return sendJson(response, 502, { error: error.message || 'Verification service unavailable.' });
    }
};
