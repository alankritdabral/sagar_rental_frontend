import { apiCall, setAuthState } from './api.js';

const loginBtn = document.getElementById('send-otp'); // Reusing the button ID for simplicity or renaming it
const phoneInput = document.getElementById('phone');
const verifiedBadge = document.getElementById('phone-verified-badge');
const nextBtn = document.getElementById('next-to-uploads');

if (loginBtn) {
    loginBtn.innerText = "Verify Phone";
    loginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value;
        if (!phone || phone.length < 10) {
            alert("Please enter a valid phone number");
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.innerText = "Verifying...";
            
            const { token, user } = await apiCall('/api/auth?action=login', 'POST', { phone });
            
            // Set session
            setAuthState(token, user);
            
            if (user.role === 'admin') {
                window.location.href = '/admin/admin.html';
                return;
            }
            
            // Successfully verified (no OTP needed)
            loginBtn.classList.add('hidden');
            verifiedBadge.classList.remove('hidden');
            
            // Enable the next step button
            const nextToSignBtn = document.getElementById('next-to-sign');
            if (nextToSignBtn) {
                nextToSignBtn.disabled = false;
                nextToSignBtn.classList.remove('bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
                nextToSignBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white');
                nextToSignBtn.innerText = "Next: Review & Sign";
            }
            
        } catch (error) {
            console.error("Login error", error);
            alert("Error: " + error.message);
            loginBtn.disabled = false;
            loginBtn.innerText = "Verify Phone";
        }
    });
}

export function updateStepProgress(step) {
    const steps = document.querySelectorAll('#step-progress [data-step]');
    steps.forEach(s => {
        const sNum = parseInt(s.getAttribute('data-step'));
        if (sNum < step) {
            s.classList.remove('step-active', 'border-slate-700');
            s.classList.add('step-done', 'border-green-500');
            s.innerHTML = '✓';
        } else if (sNum === step) {
            s.classList.add('step-active', 'border-blue-500');
            s.classList.remove('step-done', 'border-slate-700', 'border-green-500');
            s.innerHTML = sNum;
        } else {
            s.classList.remove('step-active', 'step-done', 'border-blue-500', 'border-green-500');
            s.classList.add('border-slate-700');
            s.innerHTML = sNum;
        }
    });
}
