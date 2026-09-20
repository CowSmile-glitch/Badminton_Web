document.addEventListener("DOMContentLoaded", function() {

    // =========================================================
    // 1. STICKY NAVBAR (For index.html)
    // =========================================================
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // =========================================================
    // 2. SESSION CHECK & USER PROFILE (For index.html)
    // =========================================================
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        // Fetch session data
        fetch('../backend/check_session.php')
            .then(response => response.json())
            .then(data => {
                const btnLogin = document.getElementById('btnLogin');
                const btnSignup = document.getElementById('btnSignup');
                const userNameDisplay = document.getElementById('userNameDisplay');
                const userAvatar = document.getElementById('userAvatar');
                const dashboardLink = document.getElementById('dashboardLink');

                if (data.is_logged_in) {
                    if (btnLogin) btnLogin.style.display = 'none';
                    if (btnSignup) btnSignup.style.display = 'none';
                    userProfile.style.display = 'inline-block';
                    
                    if (userNameDisplay) userNameDisplay.textContent = data.full_name;
                    
                    if (userAvatar) {
                        if (data.avatar_url && data.avatar_url !== '') {
                            // If there are images in the database, display them (with a caching parameter)
                            userAvatar.src = data.avatar_url + '?t=' + new Date().getTime();
                        } else {
                            // If none are available, use the default image with the letters.
                            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=007bff&color=fff&rounded=true`;
                        }
                    }

                    // Show dashboard for Owners (role_id = 2) and Admins (role_id = 3)
                    if ((data.role_id == 2 || data.role_id == 3) && dashboardLink) {
                        dashboardLink.style.display = 'block';
                    }
                }
            })
            .catch(error => console.error('Error fetching session data:', error));

        // Select the exact IDs from your HTML structure
        const profileBtn = document.getElementById("userDropdownBtn");
        const dropdownMenu = document.getElementById("userDropdown");

        if (profileBtn && dropdownMenu) {
            
            // 1. Toggle dropdown when clicking the profile button
            profileBtn.addEventListener("click", function(event) {
                // Prevent the click from bubbling up to the document
                event.stopPropagation(); 
                
                // Toggle the visibility class
                dropdownMenu.classList.toggle("show");
            });

            // 2. Close dropdown automatically when clicking outside
            document.addEventListener("click", function(event) {
                if (!profileBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    dropdownMenu.classList.remove("show");
                }
            });
            
        }

        // Handle Logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', function(event) {
                event.preventDefault();
                fetch('../backend/logout.php', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if(data.status === 'success') {
                        // Redirect users to the login page after they log out.
                        window.location.href = 'login.html'; 
                    }
                })
                .catch(error => console.error('Error during logout:', error));
            });
        }
    }
});