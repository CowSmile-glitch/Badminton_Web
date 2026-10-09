document.addEventListener('DOMContentLoaded', function() {
    
    // Check if there is an ID parameter in the URL (e.g., accessed from venues.html)
    const urlParams = new URLSearchParams(window.location.search);
    const viewVenueId = urlParams.get('id');
    const fetchUrl = viewVenueId ? `../backend/get_venue.php?id=${viewVenueId}` : '../backend/get_venue.php';

    // ================= 1. LOAD DASHBOARD DATA =================
    function loadDashboardData() {
        fetch(fetchUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    
                    // Determine if the current viewer is the owner of the venue
                    const isOwner = data.is_owner; 
                    const currentVenueId = data.data.venue_id || '';

                    // A. Update basic venue info
                    const venueCard = document.getElementById('venueCard');
                    const venueDetails = document.getElementById('venueDetailsSection');
                    const vcName = document.getElementById('vcName');
                    const vcAddress = document.getElementById('vcAddress');
                    const vcTime = document.getElementById('vcTime');
                    const vcImage = document.getElementById('vcImage');

                    let vcBadge = document.getElementById('vcBadge') || document.querySelector('.vc-badge');

                    if (venueCard) venueCard.style.display = 'block';
                    if (venueDetails) venueDetails.style.display = 'block';
                    
                    if(vcName) vcName.innerText = data.data.name;
                    if(vcAddress) vcAddress.innerText = data.data.address;
                    if(vcTime) vcTime.innerText = ` ${data.data.opening_time} - ${data.data.closing_time}`;
                    if(vcImage && data.data.cover_image_url) {
                        vcImage.src = '../' + data.data.cover_image_url;
                    }

                    // HIDE MANAGEMENT BUTTONS IF VIEWED BY A GUEST
                    if (!isOwner) {
                        document.querySelectorAll('button').forEach(btn => {
                            const text = btn.innerText.trim();
                            if (text === 'Manage Courts' || text === 'Edit Profile' || text === 'Delete') {
                                btn.style.display = 'none';
                            }
                        });
                    }

                    if (vcBadge) {
                        let currentStatus = data.data.status || 'active';
                        
                        // Initial UI setup
                        vcBadge.innerText = currentStatus.toUpperCase();
                        vcBadge.style.backgroundColor = (currentStatus === 'active') ? '#28a745' : '#9e9e9e';
                        
                        // CRITICAL FIX: Force badge to be clickable over any image/container CSS
                        vcBadge.style.pointerEvents = 'auto';
                        vcBadge.style.position = 'absolute'; 
                        vcBadge.style.zIndex = '100';

                        // ONLY ALLOW CLICKS IF THE USER IS THE OWNER
                        if (isOwner) {
                            vcBadge.style.cursor = 'pointer';
                            vcBadge.title = 'Click to toggle status';
                            vcBadge.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent clicking elements behind the badge
                                
                                // Show loading spinner inside the badge
                                vcBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                                
                                fetch('../backend/toggle_venue_status.php', { method: 'POST' })
                                .then(res => res.json())
                                .then(resData => {
                                    if(resData.status === 'success') {
                                        currentStatus = resData.new_status || (currentStatus === 'active' ? 'inactive' : 'active');
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
                        } else {
                            // Non-owners cannot click the status badge
                            vcBadge.style.cursor = 'default';
                        }
                    }

                    // B. Setup Information Tab
                    const tabInfo = document.getElementById('tab-info');
                    if (tabInfo) {
                        if (data.data.description && data.data.description.trim() !== '') {
                            tabInfo.innerHTML = `
                                <h3 class="tab-title" style="color: #00796b; margin-bottom: 15px;">Information</h3>
                                <p style="white-space: pre-line; line-height: 1.6;">${data.data.description}</p>
                            `;
                        } else {
                            tabInfo.innerHTML = `<p style="color: #999; font-style: italic;">No information available.</p>`;
                        }
                    }

                    // C. Setup Rules Tab
                    const tabRules = document.getElementById('tab-rules');
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

                    // D. Setup Services & Pricing Tab
                    const tabServices = document.getElementById('tab-services');
                    if (tabServices) {
                        const t1 = data.data.time_slot_1 || '07:00 - 17:00';
                        const p1 = data.data.price_1 || '25,000 ₫';
                        const t2 = data.data.time_slot_2 || '17:00 - 22:00';
                        const p2 = data.data.price_2 || '50,000 ₫';

                        // Conditionally render edit and add buttons based on ownership
                        const editPriceBtn = isOwner ? `<button onclick="location.href='edit_venue.html'" style="background: #e0f2f1; color: #00796b; border: 1px solid #b2dfdb; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold;"><i class="fa-solid fa-pen"></i> Edit Court Price</button>` : '';
                        
                        const addServiceHtml = isOwner ? `
                            <div style="display: flex; gap: 10px; margin-bottom: 20px; align-items: center; background: #f8fbf9; padding: 15px; border-radius: 8px; border: 1px solid #c8d6ce;">
                                <input type="text" id="newServiceName" placeholder="Item Name (e.g., Aquafina Water)" class="form-control" style="flex: 2; margin: 0; padding: 10px;">
                                <input type="text" id="newServicePrice" placeholder="Price (e.g., 10,000 ₫)" class="form-control" style="flex: 1; margin: 0; padding: 10px;">
                                <button id="btnAddService" style="background: #00796b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; white-space: nowrap;">
                                    <i class="fa-solid fa-plus"></i> Add Item
                                </button>
                            </div>` : '';

                        const thActionHtml = isOwner ? `<th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600; text-align: center; width: 80px;">Action</th>` : '';

                        tabServices.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 class="tab-title" style="color: #00796b; text-transform: uppercase; margin: 0; font-size: 18px;">COURT PRICING</h3>
                                ${editPriceBtn}
                            </div>
                            
                            <div class="pricing-category" style="text-align: center; font-weight: 700; color: #00796b; font-size: 18px; margin-bottom: 10px;">Badminton</div>
                            
                            <table class="pricing-table" style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                                <thead>
                                    <tr><th colspan="3" style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600;">Customer</th></tr>
                                    <tr>
                                        <th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600;">Day</th>
                                        <th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600;">Time Frame</th>
                                        <th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td rowspan="2" style="border: 1px solid #c8d6ce; padding: 12px; text-align: center; vertical-align: middle;">Mon - Sun</td>
                                        <td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center;">${t1}</td>
                                        <td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center;">${p1}</td>
                                    </tr>
                                    <tr>
                                        <td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center;">${t2}</td>
                                        <td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center;">${p2}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style="border-top: 2px dashed #c8d6ce; padding-top: 25px;">
                                <h3 class="tab-title" style="color: #00796b; text-transform: uppercase; margin-bottom: 15px; font-size: 18px;">ADDITIONAL SERVICES (Drinks, Rentals)</h3>
                                
                                ${addServiceHtml}

                                <table class="pricing-table" style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr>
                                            <th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600; text-align: left;">Item / Service</th>
                                            <th style="border: 1px solid #c8d6ce; padding: 12px; background: #f8fbf9; color: #003d2b; font-weight: 600; text-align: center;">Price</th>
                                            ${thActionHtml}
                                        </tr>
                                    </thead>
                                    <tbody id="servicesTableBody">
                                        <tr><td colspan="${isOwner ? 3 : 2}" style="text-align: center; padding: 15px;">Loading...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        `;

                        // Fetch services by venue ID
                        const loadServices = () => {
                            fetch(`../backend/get_services.php?venue_id=${currentVenueId}`)
                            .then(res => res.json())
                            .then(resData => {
                                const tbody = document.getElementById('servicesTableBody');
                                if (resData.status === 'success') {
                                    if (resData.data.length === 0) {
                                        tbody.innerHTML = `<tr><td colspan="${isOwner ? 3 : 2}" style="text-align: center; padding: 15px; color: #999;">No additional services added yet.</td></tr>`;
                                        return;
                                    }
                                    let rows = '';
                                    resData.data.forEach(item => {
                                        const tdActionHtml = isOwner ? `<td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center;">
                                            <button onclick="deleteService(${item.id})" style="background: #e53935; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" title="Delete">
                                                <i class="fa-solid fa-trash"></i>
                                            </button></td>` : '';
                                        
                                        rows += `
                                            <tr>
                                                <td style="border: 1px solid #c8d6ce; padding: 12px;">${item.service_name}</td>
                                                <td style="border: 1px solid #c8d6ce; padding: 12px; text-align: center; color: #e53935; font-weight: bold;">${item.price}</td>
                                                ${tdActionHtml}
                                            </tr>
                                        `;
                                    });
                                    tbody.innerHTML = rows;
                                }
                            });
                        };

                        // Add new service logic (Only executable by owner)
                        if (isOwner) {
                            const btnAddService = document.getElementById('btnAddService');
                            if (btnAddService) {
                                btnAddService.addEventListener('click', function() {
                                    const nameInput = document.getElementById('newServiceName');
                                    const priceInput = document.getElementById('newServicePrice');
                                    if (!nameInput.value || !priceInput.value) {
                                        alert('Please enter both item name and price.'); return;
                                    }
                                    const formData = new FormData();
                                    formData.append('service_name', nameInput.value);
                                    formData.append('price', priceInput.value);
                                    btnAddService.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                                    fetch('../backend/add_service.php', { method: 'POST', body: formData })
                                    .then(res => res.json())
                                    .then(dataService => {
                                        btnAddService.innerHTML = '<i class="fa-solid fa-plus"></i> Add Item';
                                        if (dataService.status === 'success') {
                                            nameInput.value = ''; priceInput.value = '';
                                            loadServices();
                                        } else {
                                            alert(dataService.message);
                                        }
                                    });
                                });
                            }
                        }

                        loadServices(); // Trigger load
                    }

                    // E. Setup Gallery Tab
                    const tabImages = document.getElementById('tab-images');
                    if (tabImages) {
                        const uploadHtml = isOwner ? `
                            <div style="margin-bottom: 20px; padding: 15px; background: #f8fbf9; border: 1px dashed #00796b; border-radius: 8px; display: flex; gap: 10px; align-items: center;">
                                <input type="file" id="galleryUploadInput" multiple accept="image/*" class="form-control" style="flex: 1;">
                                <button id="btnUploadGallery" style="background: #00796b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload
                                </button>
                            </div>` : '';

                        tabImages.innerHTML = `
                            <h3 class="tab-title" style="color: #00796b; margin-bottom: 15px;">Venue Gallery</h3>
                            ${uploadHtml}
                            <div id="galleryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;"></div>
                        `;

                        function loadGalleryImages() {
                            const galleryGrid = document.getElementById('galleryGrid');
                            galleryGrid.innerHTML = '<p style="color: #00796b; grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Loading images...</p>';
                            
                            // Fetch images using current venue ID
                            fetch(`../backend/get_gallery.php?venue_id=${currentVenueId}`)
                            .then(async res => {
                                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                                const text = await res.text();
                                try { return JSON.parse(text); } 
                                catch (e) { throw new Error("Invalid JSON from server."); }
                            })
                            .then(resData => {
                                if (resData.status === 'success') {
                                    galleryGrid.innerHTML = '';
                                    if (resData.data.length === 0) {
                                        galleryGrid.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center; padding: 20px;">No images uploaded yet.</p>';
                                        return;
                                    }
                                    resData.data.forEach(img => {
                                        galleryGrid.innerHTML += `
                                            <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); height: 150px; background: #eee;">
                                                <img src="../${img.image_url}" alt="Venue Gallery" 
                                                     style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; cursor: pointer;" 
                                                     onmouseover="this.style.transform='scale(1.05)'" 
                                                     onmouseout="this.style.transform='scale(1)'" 
                                                     onclick="openLightbox('../${img.image_url}')">
                                            </div>
                                        `;
                                    });
                                } else {
                                    galleryGrid.innerHTML = `<p style="color: #e53935; grid-column: 1/-1; text-align: center;">Error: ${resData.message}</p>`;
                                }
                            })
                            .catch(err => {
                                galleryGrid.innerHTML = `<p style="color: #e53935; grid-column: 1/-1; text-align: center;">Failed to load images: ${err.message}</p>`;
                            });
                        }

                        // Upload logic (Only active for owners)
                        if (isOwner) {
                            const btnUpload = document.getElementById('btnUploadGallery');
                            const uploadInput = document.getElementById('galleryUploadInput');
                            if(btnUpload) {
                                btnUpload.addEventListener('click', function() {
                                    if (uploadInput.files.length === 0) {
                                        alert('Please select at least one image to upload.'); return;
                                    }
                                    const formData = new FormData();
                                    for (let i = 0; i < uploadInput.files.length; i++) {
                                        formData.append('gallery_images[]', uploadInput.files[i]);
                                    }
                                    const originalText = btnUpload.innerHTML;
                                    btnUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                                    btnUpload.disabled = true;

                                    fetch('../backend/upload_gallery.php', { method: 'POST', body: formData })
                                    .then(res => res.json())
                                    .then(dataUpload => {
                                        btnUpload.innerHTML = originalText;
                                        btnUpload.disabled = false;
                                        uploadInput.value = '';
                                        alert(dataUpload.message);
                                        if (dataUpload.status === 'success') loadGalleryImages();
                                    })
                                    .catch(err => {
                                        alert('Upload failed.');
                                        btnUpload.innerHTML = originalText;
                                        btnUpload.disabled = false;
                                    });
                                });
                            }
                        }

                        loadGalleryImages(); // Trigger load
                    }

                // Error conditions preserved completely from original code
                } else if (data.status === 'no_venue') {
                    // Redirect to create if venue doesn't exist
                    window.location.href = 'create_venue.html';
                }
                else if (data.status === 'forbidden') {
                    alert('Access Denied: Only venue owners can access this page.');
                    window.location.href = 'index.html';
                } 
                // Condition 4: Not logged in
                else if (data.status === 'unauthorized') {
                    window.location.href = 'login.html';
                } 
            })
            .catch(error => console.error('Error fetching dashboard data:', error));
    }

    // Call load on page start
    loadDashboardData();

    // ================= 2. GLOBAL FUNCTIONS =================
    
    // Switch tabs function
    window.openTab = function(evt, tabName) {
        const tabContent = document.getElementsByClassName("tab-content");
        for (let i = 0; i < tabContent.length; i++) {
            tabContent[i].style.display = "none";
        }
        const tabBtns = document.getElementsByClassName("tab-btn");
        for (let i = 0; i < tabBtns.length; i++) {
            tabBtns[i].className = tabBtns[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    };

    // Delete Venue Main function
    window.deleteVenue = function() {
        if(confirm('Are you sure you want to delete your entire venue? This action cannot be undone.')) {
            fetch('../backend/delete_venue.php', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if(data.status === 'success') {
                    alert('Venue deleted successfully.');
                    window.location.href = 'create_venue.html';
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(err => console.error('Error deleting venue:', err));
        }
    };

    // Delete Extra Service function
    window.deleteService = function(id) {
        if(confirm('Are you sure you want to delete this service?')) {
            fetch('../backend/delete_service.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_id: id })
            })
            .then(res => res.json())
            .then(dataDelete => {
                if (dataDelete.status === 'success') {
                    loadDashboardData(); 
                } else {
                    alert(dataDelete.message);
                }
            });
        }
    };

    // Lightbox open function
    window.openLightbox = function(imageSrc) {
        const lightbox = document.getElementById('imageLightbox');
        const lightboxImg = document.getElementById('lightboxImage');
        if (lightbox && lightboxImg) {
            lightboxImg.src = imageSrc;
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden'; 
        }
    };

    // Lightbox close function
    window.closeLightbox = function() {
        const lightbox = document.getElementById('imageLightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto'; 
        }
    };

    // Auto-click the default tab on load
    const defaultOpenBtn = document.getElementById('defaultOpen');
    if (defaultOpenBtn) {
        defaultOpenBtn.click();
    }

});