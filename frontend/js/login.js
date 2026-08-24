document.addEventListener("DOMContentLoaded", function() {
    
// =========================================================
    // 4. LOGIN LOGIC (For login.html)
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) errorMessage.style.display = 'none'; 

            const formData = new FormData(this);

            // Fetch adjusted to match new file name: login.php
            fetch('../backend/login.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json()) 
            .then(data => {
                if (data.status === 'success') {
                    alert('Welcome back! Redirecting...');
                    window.location.href = 'index.html'; 
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = data.message;
                        errorMessage.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Network Error:', error);
                if (errorMessage) {
                    errorMessage.textContent = 'An error occurred while connecting to the server.';
                    errorMessage.style.display = 'block';
                }
            });
        });
    }
});