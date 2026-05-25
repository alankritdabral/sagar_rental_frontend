// API and Auth State Management (formerly firebase.js)

const getApiBaseUrl = () => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
            return import.meta.env.VITE_API_BASE_URL;
        }
    } catch (e) {}
    return '';
};

const API_BASE_URL = getApiBaseUrl();

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('auth_token');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) options.body = JSON.stringify(body);
    
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
    const response = await fetch(url, options);
    if (!response.ok) {
        const status = response.status;
        const text = await response.text();
        let errorMsg = `API Error ${status}`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMsg += `: ${json.error}`;
            else errorMsg += `: ${text}`;
        } catch (e) {
            errorMsg += text ? `: ${text}` : '';
        }
        throw new Error(errorMsg);
    }
    return response.json();
};

// Mock user state
export const auth = {
    get currentUser() {
        const user = localStorage.getItem('user_data');
        return user ? JSON.parse(user) : null;
    }
};

// Helper to set auth state
export const setAuthState = (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-changed'));
};

export const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.dispatchEvent(new Event('auth-changed'));
};

// Real-time polling (replacing onSnapshot)
let statusPoller;
const startPoller = () => {
    if (statusPoller) clearInterval(statusPoller);
    statusPoller = setInterval(async () => {
        if (!auth.currentUser) return;
        try {
            const data = await apiCall('/api/users');
            if (!data || data.role === 'admin') return; // Don't poll/redirect for admins

            const path = window.location.pathname;
            
            if (data.status === 'approved' && !path.includes('dashboard') && !path.includes('payment')) {
                window.location.href = '/dashboard.html';
            }
            
            // Only show overlay if status is pending AND they have already submitted details (fullName exists)
            if (data.status === 'pending' && data.fullName && (path === '/' || path.includes('index')) && data.role !== 'admin') {
                if (!document.getElementById('pending-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.id = 'pending-overlay';
                    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a] text-white font-sans text-center';
                    overlay.innerHTML = `
                        <div class="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                            <div class="text-6xl mb-4">⏳</div>
                            <h2 class="text-2xl font-bold mb-2">Verification Under Review</h2>
                            <p class="text-slate-400 mb-6">Your documents are being verified by our team. You will be redirected to the payment page once approved.</p>
                            <button id="overlay-logout" class="text-sm text-slate-500 hover:text-white underline">Logout & Try Another Account</button>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    document.getElementById('overlay-logout').onclick = () => {
                        logout();
                        window.location.reload();
                    };
                }
            } else {
                const overlay = document.getElementById('pending-overlay');
                if (overlay) overlay.remove();
            }
        } catch (e) {
            console.error("Polling error", e);
        }
    }, 5000);
};

window.addEventListener('auth-changed', () => {
    if (auth.currentUser) {
        startPoller();
    } else {
        if (statusPoller) clearInterval(statusPoller);
        const overlay = document.getElementById('pending-overlay');
        if (overlay) overlay.remove();
    }
});

// Initial start
if (auth.currentUser) startPoller();
