document.addEventListener("DOMContentLoaded", function() {
    
    // Global variable to store the selected avatar file before saving
    let selectedAvatarFile = null;

    // ================= 1. PROFILE PAGE LOGIC (FETCH & UPDATE) =================
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        // --- A. Fetch User Data on Page Load ---
        fetch('../backend/get_profile.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const user = data.user;
                // ================= AUTO-FILL FORM DATA =================
                
                const fullNameInput = document.getElementById('fullName');
                const emailInput = document.getElementById('email');
                const phoneInput = document.getElementById('phone');
                const genderSelect = document.getElementById('gender');

                if (fullNameInput) fullNameInput.value = user.full_name || '';
                if (emailInput) {
                    emailInput.value = user.email || '';
                    emailInput.readOnly = true; 
                    emailInput.style.backgroundColor = '#f4f4f4'; 
                    emailInput.style.cursor = 'not-allowed'; 
                }
                if (phoneInput) phoneInput.value = user.phone || user.phone_number || user.phoneNumber || '';
                
                if (genderSelect && user.gender) {
                    for (let i = 0; i < genderSelect.options.length; i++) {
                        if (genderSelect.options[i].value === user.gender) {
                            genderSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                // =======================================================
                
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

        // --- B. Handle Form Submission (Update Profile & Avatar) ---
        profileForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const formData = new FormData(this);
            const statusDiv = document.getElementById('profileStatus');
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Show loading state on the submit button
            let originalBtnText = "Save Changes";
            if (submitBtn) {
                originalBtnText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
                submitBtn.disabled = true;
            }
            
            // 1. Prepare avatar upload promise (if a new image is selected)
            let avatarPromise = Promise.resolve(null);
            if (selectedAvatarFile) {
                const avatarData = new FormData();
                avatarData.append('avatar', selectedAvatarFile);
                avatarPromise = fetch('../backend/upload_avatar.php', {
                    method: 'POST',
                    body: avatarData
                }).then(res => res.json());
            }

            // 2. Prepare profile data update promise
            const profilePromise = fetch('../backend/update_profile.php', {
                method: 'POST',
                body: formData
            }).then(res => res.json());

            // 3. Execute both requests simultaneously
            Promise.all([avatarPromise, profilePromise])
            .then(([avatarData, profileData]) => {
                statusDiv.style.display = 'block';
                
                let isSuccess = (profileData.status === 'success');
                let message = profileData.message;

                // Check avatar upload result if a file was submitted
                if (avatarData) {
                    if (avatarData.status === 'success') {
                        // Update navbar avatar instantly
                        const navAvatar = document.getElementById('userAvatar');
                        if (navAvatar) navAvatar.src = avatarData.avatar_url + '?t=' + new Date().getTime();
                        
                        // Clear the selected file after successful upload
                        selectedAvatarFile = null; 
                    } else {
                        message = 'Profile saved, but avatar upload failed: ' + avatarData.message;
                    }
                }
                
                if (isSuccess) {
                    statusDiv.className = 'status-msg msg-success';
                    statusDiv.textContent = message;
                    
                    const newName = document.getElementById('fullName').value;
                    const navName = document.getElementById('userNameDisplay');
                    
                    if (navName) navName.textContent = newName;
                } else {
                    statusDiv.className = 'status-msg msg-error';
                    statusDiv.textContent = profileData.message;
                }
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                statusDiv.style.display = 'block';
                statusDiv.className = 'status-msg msg-error';
                statusDiv.textContent = 'A network error occurred while saving.';
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .finally(() => {
                // Restore the submit button state
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        });
    }

    // ================= 2. PROCESSING AVATAR (PREVIEW ONLY) =================
    const avatarInput = document.getElementById('avatarInput');
    const btnChangePhoto = document.getElementById('btnChangePhoto');
    
    // Activate the hidden input tag when the button is pressed
    if (btnChangePhoto && avatarInput) {
        btnChangePhoto.addEventListener('click', function(e) {
            e.preventDefault(); 
            avatarInput.click();
        });
    }
    
    // Capture the event when the user selects an image
    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
    
            // Store the file in the global variable to upload later when submitting the form
            selectedAvatarFile = file;

            // Use FileReader to preview the image locally immediately
            const reader = new FileReader();
            reader.onload = function(e) {
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar) {
                    profileAvatar.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
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