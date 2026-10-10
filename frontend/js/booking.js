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

        // Variable to track the last clicked slot for range selection logic
        let lastClickedSlot = null;

        // 5. Attach click events to available slots with Range Selection logic
        document.querySelectorAll('.slot.available').forEach(cell => {
            cell.addEventListener('click', function() {
                const courtId = this.dataset.courtId;
                const time = this.dataset.time;
                const price = parseFloat(this.dataset.price);
                const courtName = this.dataset.courtName;

                // Get all slots in the current row to find indices
                const courtRow = this.closest('tr');
                const allCourtSlots = Array.from(courtRow.querySelectorAll('td.slot'));
                const currentIndex = allCourtSlots.indexOf(this);

                const isSelecting = !this.classList.contains('selected');

                if (isSelecting) {
                    // Check if we can perform a range selection (filling the gap between 2 clicks)
                    if (lastClickedSlot && lastClickedSlot.courtId === courtId && lastClickedSlot.isSelecting) {
                        const startIdx = Math.min(lastClickedSlot.index, currentIndex);
                        const endIdx = Math.max(lastClickedSlot.index, currentIndex);
                        
                        // Check if there are any booked or locked slots in the middle of the range
                        let canSelectRange = true;
                        for (let i = startIdx; i <= endIdx; i++) {
                            if (allCourtSlots[i].classList.contains('booked') || allCourtSlots[i].classList.contains('locked')) {
                                canSelectRange = false;
                                break;
                            }
                        }

                        if (canSelectRange) {
                            // Select all slots in the range automatically
                            for (let i = startIdx; i <= endIdx; i++) {
                                const slotCell = allCourtSlots[i];
                                if (!slotCell.classList.contains('selected')) {
                                    slotCell.classList.add('selected');
                                    selectedSlots.push({
                                        courtId: slotCell.dataset.courtId,
                                        courtName: slotCell.dataset.courtName,
                                        time: slotCell.dataset.time,
                                        price: parseFloat(slotCell.dataset.price)
                                    });
                                }
                            }
                        } else {
                            // If range is blocked by booked slots, just select the single clicked slot normally
                            this.classList.add('selected');
                            selectedSlots.push({ courtId, courtName, time, price });
                        }
                    } else {
                        // Normal single select (First click)
                        this.classList.add('selected');
                        selectedSlots.push({ courtId, courtName, time, price });
                    }
                    
                    // Update last clicked status
                    lastClickedSlot = { courtId: courtId, index: currentIndex, isSelecting: true };
                } else {
                    // Deselecting a slot
                    this.classList.remove('selected');
                    selectedSlots = selectedSlots.filter(s => !(s.courtId === courtId && s.time === time));
                    
                    // Reset range tracking to avoid weird behavior after deselection
                    lastClickedSlot = { courtId: courtId, index: currentIndex, isSelecting: false };
                }

                updateSummary();
            });
        });
    }

    // 6. Update the checkout summary UI (NEW: GROUPING LOGIC ADDED)
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

        // --- NEW LOGIC: Group continuous time slots ---
        
        // Step 1: Group selected slots by courtId (in case user books multiple courts)
        const courtsMap = {};
        selectedSlots.forEach(slot => {
            if (!courtsMap[slot.courtId]) {
                courtsMap[slot.courtId] = { courtName: slot.courtName, slots: [] };
            }
            courtsMap[slot.courtId].slots.push(slot);
            totalPrice += slot.price;
        });

        // Helper function to convert "HH:MM" to minutes for easy comparison
        const getMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        // Helper function to calculate the end time (adds 30 mins to a slot's start time)
        const getEndTime = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            let endM = m + 30;
            let endH = h;
            if (endM >= 60) {
                endH += 1;
                endM -= 60;
            }
            return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
        };

        // Step 2: Find continuous blocks for each court
        for (const courtId in courtsMap) {
            const courtData = courtsMap[courtId];
            
            // Sort slots chronologically
            courtData.slots.sort((a, b) => getMinutes(a.time) - getMinutes(b.time));

            let currentBlock = null;

            courtData.slots.forEach((slot, index) => {
                const slotMins = getMinutes(slot.time);

                if (!currentBlock) {
                    // Start a new block
                    currentBlock = {
                        startTime: slot.time,
                        lastSlotTime: slot.time,
                        price: slot.price
                    };
                } else {
                    const prevMins = getMinutes(currentBlock.lastSlotTime);
                    // Check if continuous (difference is exactly 30 minutes)
                    if (slotMins === prevMins + 30) {
                        currentBlock.lastSlotTime = slot.time;
                        currentBlock.price += slot.price;
                    } else {
                        // Gap detected, render the previous block
                        const endTime = getEndTime(currentBlock.lastSlotTime);
                        const li = document.createElement('li');
                        li.style.marginBottom = "8px"; // add some spacing
                        li.innerHTML = `<strong>${courtData.courtName}</strong>: ${currentBlock.startTime} - ${endTime} <em>(${currentBlock.price.toLocaleString('vi-VN')} VND)</em>`;
                        summaryList.appendChild(li);

                        // Start a new block for the current slot
                        currentBlock = {
                            startTime: slot.time,
                            lastSlotTime: slot.time,
                            price: slot.price
                        };
                    }
                }

                // If it's the last slot in the array, render the final block
                if (index === courtData.slots.length - 1) {
                    const endTime = getEndTime(currentBlock.lastSlotTime);
                    const li = document.createElement('li');
                    li.style.marginBottom = "8px"; 
                    li.innerHTML = `<strong>${courtData.courtName}</strong>: ${currentBlock.startTime} - ${endTime} <em>(${currentBlock.price.toLocaleString('vi-VN')} VND)</em>`;
                    summaryList.appendChild(li);
                }
            });
        }
        // ----------------------------------------------

        // Calculate total hours (Each slot is 30 minutes, or 0.5 hours)
        const totalHours = selectedSlots.length * 0.5;
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