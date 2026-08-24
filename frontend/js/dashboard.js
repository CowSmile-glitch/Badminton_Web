document.addEventListener("DOMContentLoaded", function() {
    
    const courtList = document.getElementById('courtList');
    const courtModal = document.getElementById('courtModal');
    const courtForm = document.getElementById('courtForm');
    
    // 1. Fetch and Render Courts
    function loadCourts() {
        fetch('../backend/manage_courts.php?action=fetch')
        .then(res => res.json())
        .then(data => {
            courtList.innerHTML = '';
            
            if (data.status === 'success') {
                data.data.forEach(court => {
                    const statusBadge = court.status === 'available' ? 'bg-success' : 'bg-warning';
                    
                    // Image display processing (if no image is present, display "No Image").
                    const imageHtml = court.image_url 
                        ? `<img src="${court.image_url}" alt="Court" style="width: 70px; height: 50px; object-fit: cover; border-radius: 4px;">` 
                        : `<span class="badge" style="background:#e9ecef; color:#6c757d;">No Image</span>`;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>#${court.court_id}</td>
                        <td>${imageHtml}</td>
                        <td><strong>${court.court_name}</strong></td>
                        <td>${Number(court.price_per_hour).toLocaleString('vi-VN')} ₫</td>
                        <td><span class="badge ${statusBadge}">${court.status.toUpperCase()}</span></td>
                        <td>
                            <button class="action-btn btn-edit" data-id="${court.court_id}" data-name="${court.court_name}" data-price="${court.price_per_hour}" data-status="${court.status}"><i class="fa-solid fa-pen"></i></button>
                            <button class="action-btn btn-delete" data-id="${court.court_id}"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `;
                    courtList.appendChild(row);
                });
                attachActionListeners();
            } else {
                courtList.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${data.message}</td></tr>`;
            }
        })
        .catch(error => console.error("Error fetching courts:", error));
    }

    // Initialize load
    loadCourts();

    // 2. Event Listeners for Dynamic Buttons (Edit/Delete)
    function attachActionListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                openModal('edit', this.dataset.id, this.dataset.name, this.dataset.price, this.dataset.status);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteCourt(this.dataset.id);
            });
        });
    }

    // 3. Modal Control
    function openModal(type, id = '', name = '', price = '', status = 'available') {
        courtModal.style.display = 'flex';
        document.getElementById('actionType').value = type;
        
        // Always leave the file selection box blank each time you open the form.
        document.getElementById('courtImage').value = ''; 
        
        if (type === 'edit') {
            document.getElementById('modalTitle').textContent = 'Edit Court';
            document.getElementById('courtId').value = id;
            document.getElementById('courtName').value = name;
            document.getElementById('courtPrice').value = price;
            document.getElementById('courtStatus').value = status;
            document.getElementById('statusGroup').style.display = 'block';
        } else {
            document.getElementById('modalTitle').textContent = 'Add New Court';
            courtForm.reset();
            document.getElementById('actionType').value = 'add';
            document.getElementById('statusGroup').style.display = 'none';
        }
    }

    document.getElementById('btnOpenAddModal').addEventListener('click', () => openModal('add'));
    document.getElementById('btnCloseModal').addEventListener('click', () => courtModal.style.display = 'none');

    // 4. Form Submission (Add/Edit)
    courtForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // FormData will automatically combine both text and image files for sending.
        const formData = new FormData(this);
        
        fetch('../backend/manage_courts.php', { 
            method: 'POST', 
            body: formData 
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if(data.status === 'success') {
                courtModal.style.display = 'none';
                loadCourts();
            }
        })
        .catch(error => console.error("Form error:", error));
    });

    // 5. Delete Request
    function deleteCourt(id) {
        if(confirm("Are you sure you want to delete this court? This action cannot be undone.")) {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('court_id', id);

            fetch('../backend/manage_courts.php', { 
                method: 'POST', 
                body: formData 
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if(data.status === 'success') loadCourts();
            })
            .catch(error => console.error("Delete error:", error));
        }
    }
});