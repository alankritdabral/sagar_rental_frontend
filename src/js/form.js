import { auth, apiCall, setAuthState } from './api.js';

const detailsForm = document.getElementById('details-form');
const progressBar = document.getElementById('progress-bar');
const uploadProgress = document.getElementById('upload-progress');

// Main Form Submission (All-in-One)
if (detailsForm) {
    detailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Basic validation for files
        const docs = {
            userPhoto: document.getElementById('userPhoto').files[0],
            dlFront: document.getElementById('dlFront').files[0],
            dlBack: document.getElementById('dlBack').files[0],
            aadhaar: document.getElementById('aadhaarDoc').files[0],
            selfie: document.getElementById('selfie').files[0]
        };

        if (Object.values(docs).some(f => !f)) {
            alert("Please upload all required documents.");
            return;
        }

        const formData = new FormData(detailsForm);
        const phone = formData.get('phone');
        
        if (!phone || phone.length < 10) {
            alert("Please enter a valid phone number.");
            return;
        }

        try {
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = "Processing...";
            uploadProgress.classList.remove('hidden');

            // 2. Automatic Login/Account Creation
            updateProgress(5);
            const { token, user } = await apiCall('/api/auth?action=login', 'POST', { phone });
            setAuthState(token, user);

            // 3. Upload Docs to Cloudinary
            const uploadedDocs = {};
            let p = 5;
            const stepIncrement = 85 / Object.keys(docs).length;

            for (const [key, file] of Object.entries(docs)) {
                const compressed = await compressImage(file);
                const base64 = await blobToBase64(compressed);
                const { url } = await apiCall('/api/upload', 'POST', { 
                    image: base64, 
                    folder: 'documents' 
                });
                uploadedDocs[key] = url;
                p += stepIncrement;
                updateProgress(Math.min(p, 90));
            }

            // 4. Save Complete Profile to MongoDB
            const userData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                dlNumber: formData.get('dlNumber'),
                aadhaarNumber: formData.get('aadhaarNumber'),
                address: formData.get('address'),
                phone: phone,
                uid: user.uid,
                documents: uploadedDocs,
                declarationAccepted: true,
                status: 'pending',
                createdAt: new Date()
            };

            await apiCall('/api/users', 'POST', userData);

            updateProgress(100);
            alert("Application submitted successfully! Our team will review it.");
            window.location.href = '/dashboard';
            
        } catch (error) {
            console.error("Submission error", error);
            alert("Error: " + error.message);
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Verification";
            uploadProgress.classList.add('hidden');
        }
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
            };
        };
    });
}

function updateProgress(percent) {
    if (progressBar) progressBar.style.width = percent + '%';
}
