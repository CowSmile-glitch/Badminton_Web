document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.getElementById('bookingDate');
    const scheduleTable = document.getElementById('scheduleTable');
    const summaryList = document.getElementById('summaryList');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryDuration = document.getElementById('summaryDuration');
    const btnConfirm = document.getElementById('btnConfirmBooking');
    
    // Retrieve venue_id from the URL (e.g., venue_detail.html?id=1)
    const venueId = new URLSearchParams(window.location.search).get('id') || 1; 
    let selectedSlots = []; 

    // 1. Set today as the minimum selectable date
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    // 2. Generate time labels from 07:00 to 23:00 (30-min intervals)
    const timeLabels = [];
    for (let h = 7; h <= 23; h++) {
        const hour = (h < 10 ? '0' : '') + h;
        timeLabels.push(`${hour}:00`);
        if (h !== 23) timeLabels.push(`${hour}:30`);
    }

    // 3. Fetch schedule data from the PHP API
    function fetchSchedule(date) {
        scheduleTable.innerHTML = '<tbody><tr><td style="padding: 20px;">Loading schedule...</td></tr></tbody>';
        selectedSlots = [];
        updateSummary();

        fetch(`../backend/get_schedule.php?venue_id=${venueId}&date=${date}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    renderMatrix(data.courts, data.booked_slots, date);
                } else {
                    scheduleTable.innerHTML = `<tbody><tr><td style="color:red; padding: 20px;">Error: ${data.message}</td></tr></tbody>`;
                }
            })
            .catch(error => console.error('Error fetching schedule:', error));
    }

    // 4. Render the HTML Matrix
    function renderMatrix(courts, bookedSlots, selectedDate) {
        let html = '<thead><tr><th class="court-name">Courts</th>';
        timeLabels.forEach(time => { html += `<th>${time}</th>`; });
        html += '</tr></thead><tbody>';

        const now = new Date();
        const isToday = (selectedDate === today);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        courts.forEach(court => {
            html += `<tr><td class="court-name">${court.court_name}</td>`;
            
            // Calculate price per 30 mins (Half of the hourly rate)
            const pricePerSlot = parseFloat(court.price_per_hour) / 2;

            timeLabels.forEach((time, index) => {
                // Skip the last element (23:00) as it is an end-time, not a start-time slot
                if (index === timeLabels.length - 1) return; 

                const slotId = `${court.court_id}_${time}`;
                const [h, m] = time.split(':').map(Number);
                const slotMinutes = h * 60 + m;
                
                let statusClass = 'slot available';
                if (bookedSlots.includes(slotId)) {
                    statusClass = 'slot booked';
                } else if (isToday && slotMinutes <= currentMinutes) {
                    statusClass = 'slot locked'; // Lock past times
                }

                html += `<td class="${statusClass}" 
                             data-court-id="${court.court_id}" 
                             data-court-name="${court.court_name}" 
                             data-time="${time}" 
                             data-price="${pricePerSlot}">
                         </td>`;
            });
            html += '</tr>';
        });

        html += '</tbody>';
        scheduleTable.innerHTML = html;

        // 5. Attach click events to available slots
        document.querySelectorAll('.slot.available').forEach(cell => {
            cell.addEventListener('click', function() {
                const courtId = this.dataset.courtId;
                const time = this.dataset.time;
                const price = parseFloat(this.dataset.price);
                const courtName = this.dataset.courtName;

                this.classList.toggle('selected');

                if (this.classList.contains('selected')) {
                    selectedSlots.push({ courtId, courtName, time, price });
                } else {
                    selectedSlots = selectedSlots.filter(s => !(s.courtId === courtId && s.time === time));
                }
                updateSummary();
            });
        });
    }

    // 6. Update the checkout summary UI
    function updateSummary() {
        let totalPrice = 0;
        summaryList.innerHTML = '';

        if (selectedSlots.length === 0) {
            summaryList.innerHTML = '<li>No slots selected</li>';
            summaryPrice.textContent = '0';
            summaryDuration.textContent = '0 hours'; // Reset duration
            btnConfirm.disabled = true;
            return;
        }

        // Sort items chronologically
        selectedSlots.sort((a, b) => a.time.localeCompare(b.time));

        selectedSlots.forEach(slot => {
            const li = document.createElement('li');
            li.textContent = `${slot.courtName} - ${slot.time} (${slot.price.toLocaleString('vi-VN')} VND)`;
            summaryList.appendChild(li);
            totalPrice += slot.price;
        });

        // Calculate total hours (Each slot is 30 minutes, or 0.5 hours)
        const totalHours = selectedSlots.length * 0.5;
        // Formatting grammar (e.g., "1 hour" vs "1.5 hours")
        const hourText = totalHours === 1 ? 'hour' : 'hours';

        // Update the DOM
        summaryDuration.textContent = `${totalHours} ${hourText}`;
        summaryPrice.textContent = totalPrice.toLocaleString('vi-VN');
        btnConfirm.disabled = false;
    }

    // 7. Handle booking submission
    btnConfirm.addEventListener('click', function() {
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        this.disabled = true;

        const payload = {
            date: dateInput.value,
            slots: selectedSlots 
        };

        fetch('../backend/process_matrix_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Booking Confirmed successfully!');
                fetchSchedule(dateInput.value); // Refresh matrix immediately
            } else {
                alert(data.message);
                this.innerHTML = 'CONFIRM BOOKING';
                this.disabled = false;
            }
        })
        .catch(error => {
            console.error('Submission Error:', error);
            alert('A network error occurred. Please try again.');
            this.innerHTML = 'CONFIRM BOOKING';
            this.disabled = false;
        });
    });

    // 8. Event listener for date change
    dateInput.addEventListener('change', (e) => fetchSchedule(e.target.value));
    
    // Initial fetch on page load
    fetchSchedule(dateInput.value);
});