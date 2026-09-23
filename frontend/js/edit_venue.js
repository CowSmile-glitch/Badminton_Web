document.addEventListener("DOMContentLoaded", function() {
    
    const editForm = document.getElementById('editVenueForm');
    const inputName = document.getElementById('editName');
    const inputAddress = document.getElementById('editAddress');
    const inputOpenTime = document.getElementById('editOpenTime');
    const inputCloseTime = document.getElementById('editCloseTime');
    const btnSave = document.getElementById('btnSaveSubmit');
    
    // Image Preview Elements
    const imageInput = document.getElementById('venueImageInput');
    const imagePreview = document.getElementById('imagePreview');

    // Handle Image File Selection and Live Preview
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result; // Update image src dynamically
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Fetch existing venue data on page load
    function loadVenueData() {
        fetch('../backend/get_venue.php')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    inputName.value = data.data.name;
                    inputAddress.value = data.data.address;
                    inputOpenTime.value = data.data.opening_time;
                    inputCloseTime.value = data.data.closing_time;
                    
                    // Load existing image if available
                    if (data.data.image_url) {
                        imagePreview.src = '../' + data.data.image_url;
                    }
                } else {
                    alert('Error loading venue data: ' + data.message);
                }
            })
            .catch(error => console.error('Fetch error:', error));
    }

    // Handle Form Submission (FormData natively handles the file upload)
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btnSave.disabled = true;

            const formData = new FormData(editForm);

            fetch('../backend/update_venue.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Venue profile updated successfully!');
                    window.location.href = 'my_venue.html';
                } else {
                    alert('Error: ' + data.message);
                    btnSave.innerHTML = 'Save Changes';
                    btnSave.disabled = false;
                }
            })
            .catch(error => {
                console.error('Update error:', error);
                btnSave.innerHTML = 'Save Changes';
                btnSave.disabled = false;
            });
        });
    }

    loadVenueData();
});