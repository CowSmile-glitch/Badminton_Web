document.addEventListener("DOMContentLoaded", function() {

// =========================================================
    // 3. REGISTRATION LOGIC (For register.html)
    // =========================================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault(); 

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorText = document.getElementById('passwordError');

            if (password !== confirmPassword) {
                errorText.style.display = 'block';
                return; 
            } 
            errorText.style.display = 'none';

            const formData = new FormData(this);

            // Fetch adjusted to match new file name: register.php
            fetch('../backend/register.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json()) 
            .then(data => {
                if (data.status === 'success') {
                    alert('Account created successfully! Redirecting to login...');
                    window.location.href = 'login.html'; 
                } else {
                    alert('Registration Failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Network Error:', error);
                alert('An error occurred while connecting to the server. Please try again.');
            });
        });
    }
    
});