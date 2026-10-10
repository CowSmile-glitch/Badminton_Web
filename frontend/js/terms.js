document.addEventListener("DOMContentLoaded", function() {
    
    const termsText = document.getElementById('termsText');
    const btnSaveTerms = document.getElementById('btnSaveTerms');
    const termsForm = document.getElementById('termsForm');
    const statusDiv = document.getElementById('termsStatus');

    // ================= 1. FETCH TERMS & CHECK ADMIN ROLE =================
    // Call API to check session and get user role
    fetch('../backend/check_session.php')
        .then(response => response.json())
        .then(sessionData => {
            if (sessionData.is_logged_in) {
                
                // Assuming role_id == 3 is Admin. Update this number if your Admin role_id is different (e.g., 1)
                const isAdmin = (sessionData.role_id == 3 || sessionData.role_id == 1); 
                
                if (isAdmin) {
                    // Unlock the textarea for Admin
                    termsText.readOnly = false;
                    termsText.style.backgroundColor = '#ffffff'; 
                    // Show the Save button
                    btnSaveTerms.style.display = 'inline-block';
                }
            } else {
                window.location.href = 'login.html'; // Redirect to login if not logged in
            }
        })
        .catch(error => console.error('Session Error:', error));

    // ================= 2. FETCH EXISTING TERMS CONTENT =================
    // You will need a simple backend file 'get_terms.php' to fetch the text from your database
    fetch('../backend/get_terms.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                termsText.value = data.content;
            } else {
                termsText.value = "The terms of service are currently unavailable. Please contact the administrator.";
            }
        })
        .catch(error => {
            console.error('Fetch Terms Error:', error);
            termsText.value = "Error loading terms. Please check your network connection.";
        });

    // ================= 3. HANDLE FORM SUBMIT (ADMIN ONLY) =================
    if (termsForm) {
        termsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
            const originalBtnText = btnSaveTerms.innerHTML;
            
            btnSaveTerms.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btnSaveTerms.disabled = true;

            // You will need a backend file 'update_terms.php' to update the text in your database
            fetch('../backend/update_terms.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                statusDiv.style.display = 'block';
                if (data.status === 'success') {
                    statusDiv.className = 'status-msg msg-success';
                    statusDiv.textContent = 'Terms of Service updated successfully!';
                } else {
                    statusDiv.className = 'status-msg msg-error';
                    statusDiv.textContent = data.message || 'Failed to update terms.';
                }
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .catch(error => {
                console.error('Error saving terms:', error);
                statusDiv.style.display = 'block';
                statusDiv.className = 'status-msg msg-error';
                statusDiv.textContent = 'A network error occurred while saving.';
                setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
            })
            .finally(() => {
                btnSaveTerms.innerHTML = originalBtnText;
                btnSaveTerms.disabled = false;
            });
        });
    }
});