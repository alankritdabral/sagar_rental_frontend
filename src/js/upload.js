// Image Compression and Upload Logic
const submitKycBtn = document.getElementById('submit-kyc');
const progressBar = document.getElementById('progress-bar');
const uploadProgress = document.getElementById('upload-progress');

submitKycBtn.addEventListener('click', async () => {
    const frontId = document.getElementById('frontId').files[0];
    const backId = document.getElementById('backId').files[0];
    const selfie = document.getElementById('selfie').files[0];

    if (!frontId || !backId || !selfie) {
        alert("Please select all three images.");
        return;
    }

    try {
        submitKycBtn.disabled = true;
        uploadProgress.classList.remove('hidden');
        
        // Compress and Upload each
        const frontUrl = await compressAndUpload(frontId, 'front_id');
        updateProgress(33);
        const backUrl = await compressAndUpload(backId, 'back_id');
        updateProgress(66);
        const selfieUrl = await compressAndUpload(selfie, 'selfie');
        updateProgress(100);

        // Save to Firestore
        await db.collection('users').doc(auth.currentUser.uid).set({
            ...userData,
            frontIdUrl: frontUrl,
            backIdUrl: backUrl,
            selfieUrl: selfieUrl
        });

        alert("KYC submitted successfully! Redirecting to dashboard...");
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error("Upload error", error);
        alert("Error during upload: " + error.message);
        submitKycBtn.disabled = false;
    }
});

async function compressAndUpload(file, fileName) {
    const compressedBlob = await compressImage(file);
    const storageRef = storage.ref(`users/${auth.currentUser.uid}/${fileName}.jpg`);
    await storageRef.put(compressedBlob);
    return await storageRef.getDownloadURL();
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
                const MAX_WIDTH = 1200;
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
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.7); // 70% quality
            };
        };
    });
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
}
