const crypto = require('crypto');

const {
    OTP_EXPIRY_MS,
    createToken,
    escapeHtml,
    hashOtp,
    isValidEmail,
    sendEmail,
    sendJson,
    supabaseFetch
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

    const email = String(payload.email || '').trim().toLowerCase().slice(0, 180);
    const documentId = String(payload.documentId || '').trim();

    if (documentId !== 'resume') {
        return sendJson(response, 400, { error: 'OTP verification is only required for resume access.' });
    }

    if (!isValidEmail(email)) {
        return sendJson(response, 400, { error: 'Please enter a valid email address.' });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
    const requestToken = createToken();

    let requestRecordId = '';

    try {
        const [record] = await supabaseFetch('resume_access_requests', {
            method: 'POST',
            headers: {
                Prefer: 'return=representation'
            },
            body: JSON.stringify({
                email,
                status: 'otp_sent',
                otp_hash: hashOtp(otp),
                otp_expires_at: expiresAt,
                approval_token: requestToken,
                requested_document: 'resume'
            })
        });
        requestRecordId = record.id;

        const html = `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                <h2>Resume access verification</h2>
                <p>Your verification code is:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${escapeHtml(otp)}</p>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not request Nirmalya Ghosh's resume, you can ignore this email.</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: 'Your resume access OTP',
            html
        });

        return sendJson(response, 200, {
            ok: true,
            requestId: record.id,
            expiresAt
        });
    } catch (error) {
        if (requestRecordId) {
            try {
                await supabaseFetch(`resume_access_requests?id=eq.${encodeURIComponent(requestRecordId)}`, {
                    method: 'PATCH',
                    headers: { Prefer: 'return=minimal' },
                    body: JSON.stringify({ status: 'expired' })
                });
            } catch (_) {
                // Best-effort cleanup only.
            }
        }
        return sendJson(response, 502, { error: error.message || 'OTP could not be sent.' });
    }
};
