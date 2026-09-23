document.addEventListener("DOMContentLoaded", function() {
    
    // ================= 1. MENU DROPDOWN LOGIC =================
    const profileBtn = document.getElementById("userDropdownBtn");
    const dropdownMenu = document.getElementById("userDropdown");

    if (profileBtn && dropdownMenu) {
        dropdownMenu.style.display = "none";
        
        profileBtn.addEventListener("click", function(event) {
            event.stopPropagation(); 
            if (dropdownMenu.style.display === "none" || dropdownMenu.style.display === "") {
                dropdownMenu.style.display = "block";
            } else {
                dropdownMenu.style.display = "none";
            }
        });

        document.addEventListener("click", function(event) {
            if (!profileBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.style.display = "none";
            }
        });
    }

    // ================= 2. DASHBOARD DATA & AUTHORIZATION =================
    const venueCard = document.getElementById('venueCard');
    const vcName = document.getElementById('vcName');
    const vcAddress = document.getElementById('vcAddress');
    const vcTime = document.getElementById('vcTime');
    const vcImage = document.getElementById('vcImage');
    
    // Fallback: Select the badge using class if ID is missing
    let vcBadge = document.getElementById('vcBadge') || document.querySelector('.vc-badge');

    // Hide the card initially to prevent fake data flashing
    if (venueCard) {
        venueCard.style.display = 'none';
    }

    function loadDashboardData() {
        fetch('../backend/get_venue.php')
            .then(response => response.json())
            .then(data => {
                
                // Condition 1: Vendor has an active venue
                if (data.status === 'success') {
                    
                    if (venueCard) venueCard.style.display = 'block';
                    const venueDetails = document.getElementById('venueDetailsSection');

                    if(vcName) vcName.innerText = data.data.name;
                    const tabInfo = document.getElementById('tab-info');
                    const tabRules = document.getElementById('tab-rules');

                    if (tabInfo) {
                        if (data.data.description && data.data.description.trim() !== '') {
                            tabInfo.innerHTML = `
                                <h3 class="tab-title" style="color: #00796b; margin-bottom: 15px;">Information</h3>
                                <p style="white-space: pre-line; line-height: 1.6;">${data.data.description}</p>
                            `;
                        } else {
                            tabInfo.innerHTML = `<p style="color: #999; font-style: italic;">No information available. Please edit your profile to add details.</p>`;
                        }
                    }

                    if (tabRules) {
                        if (data.data.rules && data.data.rules.trim() !== '') {
                            tabRules.innerHTML = `
                                <h3 class="tab-title" style="color: #00796b; margin-bottom: 15px;">Terms & Policies</h3>
                                <p style="white-space: pre-line; line-height: 1.6;">${data.data.rules}</p>
                            `;
                        } else {
                            tabRules.innerHTML = `<p style="color: #999; font-style: italic;">No terms and conditions specified.</p>`;
                        }
                    }
                    if(vcAddress) vcAddress.innerText = data.data.address;
                    if(vcTime) vcTime.innerText = `${data.data.opening_time} - ${data.data.closing_time}`;
                    
                    if(vcImage) {
                        if (data.data.cover_image_url && data.data.cover_image_url.trim() !== '') {
                            vcImage.src = '../' + data.data.cover_image_url;
                        } else {
                            vcImage.src = 'asset/images/badminton1.avif'; 
                        }
                        
                        // Fallback image if source is broken
                        vcImage.onerror = function() {
                            this.onerror = null;
                            this.src = 'https://placehold.co/600x400/eeeeee/999999?text=No+Cover+Image';
                        };
                    }

                    // ================= 3. TOGGLE VENUE STATUS LOGIC =================
                    if (vcBadge) {
                        let currentStatus = data.data.status || 'active';
                        
                        // Initial UI setup
                        vcBadge.innerText = currentStatus.toUpperCase();
                        vcBadge.style.backgroundColor = (currentStatus === 'active') ? '#28a745' : '#9e9e9e';
                        vcBadge.style.cursor = 'pointer';
                        vcBadge.title = 'Click to toggle status';
                        
                        // CRITICAL FIX: Force badge to be clickable over any image/container CSS
                        vcBadge.style.pointerEvents = 'auto';
                        vcBadge.style.position = 'absolute'; 
                        vcBadge.style.zIndex = '100';

                        // Click event handling
                        vcBadge.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent clicking elements behind the badge
                            
                            // Show loading spinner inside the badge
                            vcBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                            
                            fetch('../backend/toggle_venue_status.php', { method: 'POST' })
                            .then(res => res.json())
                            .then(resData => {
                                if(resData.status === 'success') {
                                    currentStatus = resData.new_status;
                                    vcBadge.innerText = currentStatus.toUpperCase();
                                    vcBadge.style.backgroundColor = (currentStatus === 'active') ? '#28a745' : '#9e9e9e';
                                } else {
                                    alert('Error: ' + resData.message);
                                    vcBadge.innerText = currentStatus.toUpperCase(); 
                                }
                            })
                            .catch(err => {
                                console.error('Status Toggle Error:', err);
                                alert('Could not connect to the server. Please try again.');
                                vcBadge.innerText = currentStatus.toUpperCase();
                            });
                        });
                    }
                    // ================================================================
                } 
                // Condition 2: Vendor has no venue yet
                else if (data.status === 'no_venue') {
                    window.location.href = 'create_venue.html';
                } 
                // Condition 3: Normal user
                else if (data.status === 'forbidden') {
                    alert('Access Denied: Only venue owners can access this page.');
                    window.location.href = 'index.html';
                } 
                // Condition 4: Not logged in
                else if (data.status === 'unauthorized') {
                    window.location.href = 'login.html';
                } 
                else {
                    console.error('Error fetching dashboard data:', data.message);
                }
            })
            .catch(error => console.error('Network Error:', error));
    }

    // Initialize Dashboard Data
    loadDashboardData();

    // ================= 4. DELETE VENUE LOGIC =================
    const btnDeleteVenue = document.getElementById('btnDeleteVenue');

    if (btnDeleteVenue) {
        btnDeleteVenue.addEventListener('click', function(e) {
            e.preventDefault();
            
            const confirmDelete = confirm("Are you sure you want to delete this venue? This action cannot be undone.");
            
            if (confirmDelete) {
                const originalText = btnDeleteVenue.innerHTML;
                btnDeleteVenue.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
                btnDeleteVenue.disabled = true;

                fetch('../backend/delete_venue.php', {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('Your venue has been deleted successfully.');
                        window.location.href = 'index.html';
                    } else {
                        alert('Error: ' + data.message);
                        btnDeleteVenue.innerHTML = originalText;
                        btnDeleteVenue.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Delete error:', error);
                    alert('Could not connect to the server.');
                    btnDeleteVenue.innerHTML = originalText;
                    btnDeleteVenue.disabled = false;
                });
            }
        });
    }

    // ================= 5. TAB SWITCHING LOGIC =================
    window.openTab = function(evt, tabName) {
        // Hide all elements with class="tab-content"
        const tabContent = document.getElementsByClassName("tab-content");
        for (let i = 0; i < tabContent.length; i++) {
            tabContent[i].style.display = "none";
        }

        // Remove the class "active" from all tab buttons
        const tabBtns = document.getElementsByClassName("tab-btn");
        for (let i = 0; i < tabBtns.length; i++) {
            tabBtns[i].className = tabBtns[i].className.replace(" active", "");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    };
});