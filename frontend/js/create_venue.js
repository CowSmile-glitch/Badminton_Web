document.addEventListener("DOMContentLoaded", function() {
    const venueForm = document.getElementById('createVenueForm');
    const statusDiv = document.getElementById('venueStatus');

    if (venueForm) {
        venueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('../backend/create_venue.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                statusDiv.style.display = 'block';
                statusDiv.textContent = data.message;
                
                if (data.status === 'success') {
                    statusDiv.className = 'msg-success';
                    
                    // If created successfully, wait 2 seconds and it will automatically switch to the Dashboard.
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    statusDiv.className = 'msg-error';
                }
            })
            .catch(error => {
                console.error('Error creating venue:', error);
                statusDiv.style.display = 'block';
                statusDiv.className = 'msg-error';
                statusDiv.textContent = 'A network error occurred. Please try again.';
            });
        });
    }
});