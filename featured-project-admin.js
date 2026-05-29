document.addEventListener('DOMContentLoaded', async () => {
    const fallbackConfig = {
        supabaseUrl: 'https://jpoxbkrzffwtfevbbgxq.supabase.co',
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwb3hia3J6ZmZ3dGZldmJiZ3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzA4NzgsImV4cCI6MjA5NDUwNjg3OH0.FB_8ZmxwKbsZ4idLj0aBiHtfo2Lzpy1HH3-wI_jm6rI'
    };
    const form = document.getElementById('admin-verification-form');
    const status = document.getElementById('admin-project-status');
    const submitButton = form?.querySelector('button[type="submit"]');
    const identityPanel = document.getElementById('admin-identity-panel');
    const authStatus = document.getElementById('admin-auth-status');
    const googleLogin = document.getElementById('admin-google-login');
    const signOutButton = document.getElementById('admin-sign-out');
    const passwordSignOutButton = document.getElementById('admin-password-sign-out');
    const googleVerificationKey = 'featuredProjectGoogleVerificationStarted';
    let supabaseClient = null;
    let session = null;
    let oauthVerifiedThisVisit = false;

    if (!form || !status || !submitButton) return;

    const setStatus = (message, state = '') => {
        status.textContent = message;
        status.dataset.state = state;
    };

    const setAuthStatus = (message, state = '') => {
        if (!authStatus) return;
        authStatus.textContent = message;
        authStatus.dataset.state = state;
    };

    const setFormEnabled = (enabled) => {
        [...form.elements].forEach(element => {
            element.disabled = !enabled;
        });
        submitButton.disabled = !enabled;
    };

    const showPasswordStep = (show) => {
        form.hidden = !show;
        if (identityPanel) identityPanel.hidden = show;
    };

    const getAdminRedirectUrl = () => 'https://nirmalya-ghosh.vercel.app/featured-project-admin.html';

    const clearOAuthParams = () => {
        const url = new URL(window.location.href);
        ['code', 'state', 'error', 'error_code', 'error_description'].forEach(param => {
            url.searchParams.delete(param);
        });
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    };

    const hasOAuthCallback = () => {
        const url = new URL(window.location.href);
        return Boolean(url.searchParams.get('code') || url.searchParams.get('error') || url.searchParams.get('error_description'));
    };

    const finishOAuthCallback = async () => {
        const url = new URL(window.location.href);
        const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
        if (oauthError) {
            clearOAuthParams();
            throw new Error(oauthError);
        }

        const code = url.searchParams.get('code');
        if (!code || !supabaseClient?.auth?.exchangeCodeForSession) return;

        const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
        clearOAuthParams();
        if (error) throw error;
        oauthVerifiedThisVisit = true;
        sessionStorage.setItem(googleVerificationKey, '1');
    };

    const loadPublicConfig = async () => {
        try {
            const configResponse = await fetch('/api/public-config', {
                cache: 'no-store'
            });
            if (!configResponse.ok) throw new Error('Config endpoint unavailable.');

            const config = await configResponse.json();
            return {
                supabaseUrl: config.supabaseUrl || fallbackConfig.supabaseUrl,
                supabaseAnonKey: config.supabaseAnonKey || fallbackConfig.supabaseAnonKey
            };
        } catch (_) {
            return fallbackConfig;
        }
    };

    const syncSession = async () => {
        if (!supabaseClient) {
            setFormEnabled(false);
            showPasswordStep(false);
            return;
        }

        const result = await supabaseClient.auth.getSession();
        session = result.data.session;

        googleLogin.hidden = Boolean(session && oauthVerifiedThisVisit);
        signOutButton.hidden = !session;

        if (!session) {
            setFormEnabled(false);
            showPasswordStep(false);
            setAuthStatus('Manually verify access with Google sign-in.');
            return;
        }

        const shouldCheckVerifiedAccount = oauthVerifiedThisVisit || sessionStorage.getItem(googleVerificationKey) === '1';
        setFormEnabled(false);
        showPasswordStep(false);
        setAuthStatus(shouldCheckVerifiedAccount ? 'Checking Google verification...' : 'Checking signed-in account...', 'loading');

        try {
            const identityResponse = await fetch('/api/admin-project-session', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (!identityResponse.ok) {
                showPasswordStep(false);
                googleLogin.hidden = false;
                sessionStorage.removeItem(googleVerificationKey);
                setAuthStatus('Access denied. This Google account is not approved for project uploads.', 'error');
                return;
            }

            if (!shouldCheckVerifiedAccount) {
                googleLogin.hidden = false;
                setAuthStatus('Manually verify access with Google sign-in.');
                return;
            }

            sessionStorage.removeItem(googleVerificationKey);
            oauthVerifiedThisVisit = true;
            showPasswordStep(true);
            setFormEnabled(true);
            setAuthStatus('Google verification complete. Continue with password confirmation.', 'success');
        } catch (error) {
            showPasswordStep(false);
            setAuthStatus(error.message || 'Access could not be verified.', 'error');
        }
    };

    try {
        const config = await loadPublicConfig();
        if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
            throw new Error('Secure sign-in is not configured for the admin page.');
        }

        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        if (hasOAuthCallback()) {
            await finishOAuthCallback();
        }
        await syncSession();
        supabaseClient.auth.onAuthStateChange(() => syncSession());
    } catch (error) {
        setAuthStatus(error.message || 'Admin authentication could not start.', 'error');
        setFormEnabled(false);
    }

    googleLogin?.addEventListener('click', async () => {
        if (!supabaseClient) return;
        googleLogin.disabled = true;
        setAuthStatus('Opening Google verification...', 'loading');
        sessionStorage.setItem(googleVerificationKey, '1');
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getAdminRedirectUrl(),
                queryParams: {
                    prompt: 'select_account'
                }
            }
        });
        if (error) {
            sessionStorage.removeItem(googleVerificationKey);
            googleLogin.disabled = false;
            setAuthStatus(error.message, 'error');
        }
    });

    const signOut = async () => {
        if (!supabaseClient) return;
        sessionStorage.removeItem('featuredProjectAdminSession');
        sessionStorage.removeItem('featuredProjectAdminSessionExpiresAt');
        sessionStorage.removeItem(googleVerificationKey);
        oauthVerifiedThisVisit = false;
        await supabaseClient.auth.signOut();
        await syncSession();
    };

    signOutButton?.addEventListener('click', signOut);
    passwordSignOutButton?.addEventListener('click', signOut);

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!session?.access_token) {
            setStatus('Please complete secure sign-in first.', 'error');
            return;
        }

        submitButton.disabled = true;
        setStatus('Verifying password and preparing upload workspace...', 'loading');

        try {
            const response = await fetch('/api/admin-project-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    adminPassword: form.adminPassword.value
                })
            });
            const result = await response.json();
            if (!response.ok || !result.adminSessionToken) throw new Error(result?.error || 'Verification failed.');

            sessionStorage.setItem('featuredProjectAdminSession', result.adminSessionToken);
            sessionStorage.setItem('featuredProjectAdminSessionExpiresAt', String(result.expiresAt || ''));
            setStatus('Verification complete. Opening the upload page...', 'success');
            window.setTimeout(() => {
                window.location.href = 'featured-project-upload.html';
            }, 700);
        } catch (error) {
            setStatus(error.message || 'Verification failed.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
});
