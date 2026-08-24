document.addEventListener("DOMContentLoaded", function() {
    
    const favoriteGrid = document.getElementById('favoriteGrid');

    if (favoriteGrid) {
        // 1. Fetch saved venues from the backend
        fetch('../backend/get_favorite_venues.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const venues = data.data;
                favoriteGrid.innerHTML = ''; // Clear loading text

                if (venues.length === 0) {
                    favoriteGrid.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; padding: 50px 0;">
                            <i class="fa-regular fa-heart" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
                            <h3 style="color: #666;">No favorites yet</h3>
                            <p style="color: #999; margin-bottom: 20px;">You haven't saved any badminton centers.</p>
                            <a href="venues.html" class="btn btn-outline">Explore Courts</a>
                        </div>
                    `;
                    return;
                }

                // 2. Render each favorite venue
                venues.forEach(v => {
                    const openTime = v.opening_time.substring(0, 5);
                    const closeTime = v.closing_time.substring(0, 5);
                    
                    const coverImg = (v.cover_image_url && v.cover_image_url !== '') 
                                     ? v.cover_image_url 
                                     : 'asset/images/badminton1.avif'; 
                    
                    const logoUrl = (v.owner_avatar && v.owner_avatar !== '') 
                                    ? v.owner_avatar 
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=e0f2f1&color=00796b&rounded=true&size=100`;

                    // Notice the heart icon is statically rendered as RED (fa-solid) 
                    // because these are already favorited.
                    const cardHTML = `
                        <div class="venue-card" id="card-${v.venue_id}">
                            <div class="venue-img-wrapper">
                                <img src="${coverImg}" alt="${v.name}">
                                
                                <div class="badges-top-left">
                                    <span class="badge badge-green"><i class="fa-solid fa-star"></i> Daily</span>
                                </div>
                                
                                <div class="badges-top-right">
                                    <!-- Heart is red by default -->
                                    <div class="icon-circle btn-remove-favorite" data-id="${v.venue_id}" style="cursor: pointer;" title="Remove from favorites">
                                        <i class="fa-solid fa-heart" style="color: #e53935;"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="venue-info">
                                <img src="${logoUrl}" alt="Venue Logo" class="venue-logo">
                                <div class="venue-text">
                                    <h3>${v.name}</h3>
                                    <div class="v-detail"><i class="fa-solid fa-location-dot"></i> <span>${v.address}</span></div>
                                    <div class="v-detail"><i class="fa-regular fa-clock"></i> <span>${openTime} - ${closeTime}</span></div>
                                </div>
                                <a href="venue_detail.html?id=${v.venue_id}" class="btn-book">BOOK NOW</a>
                            </div>
                        </div>
                    `;
                    favoriteGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            } else {
                favoriteGrid.innerHTML = `<p class="text-danger" style="text-align: center;">Error: ${data.message}</p>`;
            }
        })
        .catch(error => console.error('Error:', error));

        // ================= 3. HANDLE UN-FAVORITING =================
        // Use event delegation to handle clicks on the dynamically created remove buttons
        favoriteGrid.addEventListener('click', function(event) {
            const removeBtn = event.target.closest('.btn-remove-favorite');
            
            if (removeBtn) {
                event.preventDefault();
                const venueId = removeBtn.getAttribute('data-id');
                const icon = removeBtn.querySelector('i');
                const card = document.getElementById(`card-${venueId}`);
                
                // Show loading spinner on the icon
                icon.className = 'fa-solid fa-spinner fa-spin';
                icon.style.color = '#333';
                
                const formData = new FormData();
                formData.append('venue_id', venueId);
                
                fetch('../backend/toggle_favorite.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success' && data.action === 'removed') {
                        // Smoothly fade out the card and remove it from the grid
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.9)';
                        setTimeout(() => { card.remove(); }, 300);
                        
                        // Show empty message if grid is empty after removal
                        if (favoriteGrid.querySelectorAll('.venue-card').length === 1) {
                            setTimeout(() => { location.reload(); }, 300);
                        }
                    }
                })
                .catch(error => console.error('Error removing favorite:', error));
            }
        });
    }
});