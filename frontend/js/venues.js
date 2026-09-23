document.addEventListener("DOMContentLoaded", function() {
    
    // ================= 1. NAVBAR DROPDOWN LOGIC =================
    const profileBtn = document.getElementById("userDropdownBtn");
    const dropdownMenu = document.getElementById("userDropdown");

    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener("click", function(event) {
            event.stopPropagation(); 
            dropdownMenu.classList.toggle("show");
            profileBtn.classList.toggle("active"); 
        });

        document.addEventListener("click", function(event) {
            if (!profileBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove("show");
                profileBtn.classList.remove("active");
            }
        });
    }
    // ============================================================

    // ================= 2. VENUE GRID LOGIC ======================
    const venueGrid = document.getElementById('venueGrid');

    if (venueGrid) {
        fetch('../backend/get_all_venues.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const venues = data.data;
                venueGrid.innerHTML = ''; 

                if (venues.length === 0) {
                    venueGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No venues are currently registered.</p>';
                    return;
                }

                venues.forEach(v => {
                    const openTime = v.opening_time.substring(0, 5);
                    const closeTime = v.closing_time.substring(0, 5);
                    
                    const coverImg = (v.cover_image_url && v.cover_image_url !== '') 
                                     ? '../' + v.cover_image_url 
                                     : '../asset/images/badminton1.avif'; 
                    
                    const logoUrl = (v.owner_avatar && v.owner_avatar !== '') 
                                    ? v.owner_avatar 
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=e0f2f1&color=00796b&rounded=true&size=100`;

                    const heartClass = (v.is_favorited == 1) ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                    const heartColor = (v.is_favorited == 1) ? 'color: #e53935;' : 'color: #333;';

                    const bookBtn = (v.status === 'active') 
                        ? `<a href="venue_detail.html?id=${v.venue_id}" class="btn-book">BOOK NOW</a>` 
                        : `<span class="btn-book" style="background-color: #9e9e9e; cursor: not-allowed; display: inline-block; text-align: center;">INACTIVE</span>`;

                    const cardHTML = `
                        <div class="venue-card">
                            <div class="venue-img-wrapper">
                                <img src="${coverImg}" alt="${v.name}">
                                
                                <div class="badges-top-left">
                                    <span class="badge badge-green"><i class="fa-solid fa-star"></i> Daily</span>
                                </div>
                                
                                <div class="badges-top-right">
                                    <div class="icon-circle btn-favorite" data-id="${v.venue_id}" style="cursor: pointer;" title="Save Venue">
                                        <i class="${heartClass}" style="${heartColor}"></i>
                                    </div>
                                    <div class="icon-circle" title="Get Directions"><i class="fa-solid fa-route"></i></div>
                                </div>
                            </div>
                            
                            <div class="venue-info">
                                <img src="${logoUrl}" alt="Venue Logo" class="venue-logo" onerror="this.onerror=null; this.src='asset/images/default_avatar.png';">
                                <div class="venue-text">
                                    <h3>${v.name}</h3>
                                    <div class="v-detail"><i class="fa-solid fa-location-dot"></i> <span><span class="distance-text">(1.5km)</span> ${v.address}</span></div>
                                    <div class="v-detail"><i class="fa-regular fa-clock"></i> <span>${openTime} - ${closeTime}</span></div>
                                </div>
                                
                                ${bookBtn}

                            </div>
                        </div>
                    `;
                    venueGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            } else {
                venueGrid.innerHTML = `<p class="text-danger" style="grid-column: 1/-1; text-align: center;">Error: ${data.message}</p>`;
            }
        })
        .catch(error => console.error('Error fetching venues:', error));

        // ================= 3. FAVORITE BUTTON LOGIC =================
        venueGrid.addEventListener('click', function(event) {
            const favoriteBtn = event.target.closest('.btn-favorite');
            
            if (favoriteBtn) {
                event.preventDefault();
                const venueId = favoriteBtn.getAttribute('data-id');
                const icon = favoriteBtn.querySelector('i');
                
                const formData = new FormData();
                formData.append('venue_id', venueId);
                
                icon.className = 'fa-solid fa-spinner fa-spin';
                
                fetch('../backend/toggle_favorite.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        if (data.action === 'added') {
                            icon.className = 'fa-solid fa-heart';
                            icon.style.color = '#e53935'; 
                        } else if (data.action === 'removed') {
                            icon.className = 'fa-regular fa-heart';
                            icon.style.color = '#333'; 
                        }
                    } else {
                        icon.className = 'fa-regular fa-heart';
                        icon.style.color = '#333';
                        alert(data.message); 
                    }
                })
                .catch(error => {
                    console.error('Error toggling favorite:', error);
                    icon.className = 'fa-regular fa-heart';
                    icon.style.color = '#333';
                });
            }
        });
    }
});