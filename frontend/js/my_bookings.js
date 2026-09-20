document.addEventListener("DOMContentLoaded", function() {
    const bookingList = document.getElementById('bookingList');

    if (bookingList) {
        fetch('../backend/get_my_bookings.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const bookings = data.data;
                bookingList.innerHTML = ''; 

                if (bookings.length === 0) {
                    bookingList.innerHTML = `
                        <div class="empty-history">
                            <i class="fa-solid fa-calendar-xmark"></i>
                            <h3 style="color: #555;">No Bookings Found</h3>
                            <p style="color: #999; margin-bottom: 20px;">You haven't booked any badminton courts yet.</p>
                            <a href="venues.html" class="btn btn-outline">Find Courts Now</a>
                        </div>
                    `;
                    return;
                }

                // Render each logically grouped booking record
                bookings.forEach(b => {
                    const dateObj = new Date(b.booking_date);
                    const formattedDate = dateObj.toLocaleDateString('en-GB'); 
                    
                    const startTime = b.start_time.substring(0, 5);
                    const endTime = b.end_time.substring(0, 5);

                    // --- NEW LOGIC: Calculate Total Duration in Hours ---
                    // Create dummy dates to mathematically subtract the times
                    const startDateTime = new Date(`1970-01-01T${b.start_time}`);
                    const endDateTime = new Date(`1970-01-01T${b.end_time}`);
                    const durationInHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
                    
                    // Format grammar (e.g., "1 hour" vs "1.5 hours")
                    const hourText = durationInHours === 1 ? 'hour' : 'hours';
                    const durationDisplay = `<span style="font-weight: 600; color: #333; margin-left: 5px;">(${durationInHours} ${hourText})</span>`;
                    // ---------------------------------------------------

                    const formattedPrice = parseFloat(b.total_price).toLocaleString('vi-VN') + ' VND';

                    let statusClass = '';
                    switch (b.status) {
                        case 'pending': statusClass = 'status-pending'; break;
                        case 'confirmed': statusClass = 'status-confirmed'; break;
                        case 'completed': statusClass = 'status-completed'; break;
                        case 'cancelled': statusClass = 'status-cancelled'; break;
                    }

                    const cardHTML = `
                        <div class="booking-card">
                            <div class="b-info">
                                <div class="b-title">${b.venue_name}</div>
                                <div class="b-court">Court: ${b.court_name}</div>
                                <div class="b-datetime">
                                    <span><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
                                    <span><i class="fa-regular fa-clock"></i> ${startTime} - ${endTime} ${durationDisplay}</span>
                                </div>
                            </div>
                            <div class="b-status-section">
                                <div class="b-price">${formattedPrice}</div>
                                <div class="status-badge ${statusClass}">${b.status.toUpperCase()}</div>
                            </div>
                        </div>
                    `;
                    
                    bookingList.insertAdjacentHTML('beforeend', cardHTML);
                });
            } else {
                bookingList.innerHTML = `<p class="text-danger" style="text-align: center;">Error: ${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error('Error fetching booking history:', error);
            bookingList.innerHTML = '<p class="text-danger" style="text-align: center;">A network error occurred. Please try again.</p>';
        });
    }
});