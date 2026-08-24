document.addEventListener("DOMContentLoaded", function() {
    
    fetch('../backend/get_my_venue.php')
    .then(response => response.json())
    .then(data => {
        if (data.status === 'not_found') {
            // IF THE LOCATION DOESN'T EXIST -> MOVE TO THE CREATION PAGE
            window.location.href = 'create_venue.html';
        } 
        else if (data.status === 'success') {
            // IF A VENUE EXISTS -> HIDE LOADING, SHOW INFORMATION
            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('venueInfoSection').style.display = 'flex';
            
            const v = data.data;
            
            // Render data
            document.getElementById('vName').textContent = v.name;
            document.getElementById('vAddress').textContent = v.address;
            document.getElementById('vTime').textContent = v.opening_time.substring(0,5) + ' - ' + v.closing_time.substring(0,5);
            document.getElementById('vStatus').textContent = v.status.toUpperCase();
            
            // Profile picture processing
            const imgEl = document.getElementById('vImage');
            if (v.cover_image_url) {
                // Because the URL stored in the database is 'asset/images/image_name.jpg'
                imgEl.src = v.cover_image_url; 
            } else {
                imgEl.src = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop';
            }
        }
    })
    .catch(error => {
        console.error("Error fetching venue data:", error);
    });
});