document.addEventListener("DOMContentLoaded", function() {
    
    // ================= 1. PROFILE PAGE LOGIC (FETCH & UPDATE) =================
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        // --- A. Fetch User Data on Page Load ---
        fetch('../backend/get_profile.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const user = data.user;
                
                // (Fill in the form - you can add logic to fill in name and email here)
                
                // Display Avatar
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar) {
                    if (user.avatar_url && user.avatar_url !== '') {
                        profileAvatar.src = user.avatar_url;
                    } else {
                        profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=007bff&color=fff&size=150`;
                    }
                }
            }
        })
        .catch(error => console.error('Network Error:', error));

        // --- B. Handle Form Submission (Update Profile) ---
        profileForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const formData = new FormData(this);
            const statusDiv = document.getElementById('profileStatus');
            
            fetch('../backend/update_profile.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                statusDiv.style.display = 'block';
                
                if (data.status === 'success') {
                    statusDiv.className = 'status-msg msg-success';
                    statusDiv.textContent = data.message;
                    
                    const newName = document.getElementById('fullName').value;
                    const profileAvatar = document.getElementById('profileAvatar');
                    const navAvatar = document.getElementById('userAvatar');
                    const navName = document.getElementById('userNameDisplay');
                    
                    if (profileAvatar && (!profileAvatar.src.includes('asset/images/'))) {
                        profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=007bff&color=fff&size=150`;
                    }
                    if (navAvatar && (!navAvatar.src.includes('asset/images/'))) {
                        navAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=007bff&color=fff&rounded=true`;
                    }
                    if (navName) navName.textContent = newName;
                    
                } else {
                    statusDiv.className = 'status-msg msg-error';
                    statusDiv.textContent = data.message;
                }
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .catch(error => {
                console.error('Error updating profile:', error);
            });
        });
    }

    // ================= 2. PROCESSING AVATAR UPLOADS =================
    const avatarInput = document.getElementById('avatarInput');
    const btnChangePhoto = document.getElementById('btnChangePhoto');
    
    // Activate the hidden input tag when the button is pressed (if it's a button tag).
    if (btnChangePhoto && avatarInput) {
        btnChangePhoto.addEventListener('click', function(e) {
            e.preventDefault(); 
            avatarInput.click();
        });
    }
    
    // Capture the event when the user has finished selecting an image.
    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
    
            const formData = new FormData();
            formData.append('avatar', file);
    
            // FIX HERE: Check if the button is found before changing the text.
            let originalBtnText = 'Change Photo';
            if (btnChangePhoto) {
                originalBtnText = btnChangePhoto.innerHTML;
                btnChangePhoto.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                btnChangePhoto.disabled = true;
            }
    
            fetch('../backend/upload_avatar.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Restore the button to its original position (if any).
                if (btnChangePhoto) {
                    btnChangePhoto.innerHTML = originalBtnText;
                    btnChangePhoto.disabled = false;
                }
    
                if (data.status === 'success') {
                    // Change the image in the middle of the screen.
                    const profileAvatar = document.getElementById('profileAvatar');
                    if (profileAvatar) profileAvatar.src = data.avatar_url + '?t=' + new Date().getTime();
                    
                    // Change the image on the Navbar.
                    const navAvatar = document.getElementById('userAvatar');
                    if (navAvatar) navAvatar.src = data.avatar_url + '?t=' + new Date().getTime();
                } else {
                    alert('Upload failed: ' + data.message);
                }
                avatarInput.value = ''; 
            })
            .catch(error => {
                console.error('Upload Error:', error);
                if (btnChangePhoto) {
                    btnChangePhoto.innerHTML = originalBtnText;
                    btnChangePhoto.disabled = false;
                }
                alert('A network error occurred.');
                avatarInput.value = '';
            });
        });
    }

    // ================= 3. CHANGE PASSWORD PAGE LOGIC =================
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            const statusDiv = document.getElementById('passwordStatus');
            
            fetch('../backend/change_password.php', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                statusDiv.style.display = 'block';
                if (data.status === 'success') {
                    statusDiv.className = 'status-msg msg-success';
                    statusDiv.textContent = data.message;
                    passwordForm.reset(); 
                } else {
                    statusDiv.className = 'status-msg msg-error';
                    statusDiv.textContent = data.message;
                }
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .catch(error => console.error('Error changing password:', error));
        });
    }
    
    // ================= 4. GLOBAL LOGOUT LOGIC =================
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', performLogout);
    
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', performLogout);
    
    function performLogout(event) {
        event.preventDefault(); 
        fetch('../backend/logout.php', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'success') {
                window.location.href = 'login.html'; 
            }
        })
        .catch(error => console.error('Error during logout:', error));
    }
});