// ===== Global Utils =====
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl z-[9999] transform transition-all duration-300 translate-y-20 opacity-0 flex items-center gap-3 border border-gray-700';
    toast.innerHTML = `
        <span class="text-lg">✨</span>
        <span class="font-medium text-sm">${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    // Remove
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }
}

// ===== Global Search Logic =====
function triggerGlobalSearch() {
    const query = document.getElementById('global-search')?.value;
    if (query) handleGlobalSearch(query);
}

function handleGlobalSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        // Reset view if empty
        if (document.getElementById('products-table-body')) fetchProducts();
        if (document.getElementById('users-table-body')) fetchUsers();
        if (document.getElementById('orders-table-body')) loadOrders();
        return;
    }

    // Check if we are on orders page
    const orderTable = document.getElementById('orders-table-body');
    if (orderTable) {
        const localSearch = document.getElementById('order-search');
        if (localSearch) {
            localSearch.value = query;
            debounceLoadOrders();
            return;
        }
    }

    // Check if we are on products page
    const productTable = document.getElementById('products-table-body');
    if (productTable) {
        const rows = productTable.querySelectorAll('tr');
        let found = false;
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            if (text.includes(q)) {
                row.style.display = '';
                found = true;
            } else {
                row.style.display = 'none';
            }
        });
        if (!found) {
            // Optional: show "no results" row if all hidden
        }
        return;
    }

    // Check if we are on users page
    const userTable = document.getElementById('users-table-body');
    if (userTable) {
        const rows = userTable.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
        return;
    }

    // Fallback: Redirect to orders if searching from other pages (Dashboard, Banners, etc.)
    window.location.href = `orders.html?q=${encodeURIComponent(query)}`;
}

function handleDateRangeChange(val) {
    const startInput = document.getElementById('order-start-date');
    const endInput = document.getElementById('order-end-date');
    const container = document.getElementById('custom-date-container');
    
    if (!startInput || !endInput) return;

    const now = new Date();
    // Use local date for "today"
    const today = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    if (val === 'custom') {
        container.classList.remove('hidden');
        return; // Let user pick
    } else {
        container.classList.add('hidden');
    }

    if (val === 'all') {
        startInput.value = '';
        endInput.value = '';
    } else if (val === 'today') {
        startInput.value = today;
        endInput.value = today;
    } else if (val === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        startInput.value = yesterday.toLocaleDateString('en-CA');
        endInput.value = yesterday.toLocaleDateString('en-CA');
    } else if (val === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startInput.value = startOfMonth.toLocaleDateString('en-CA');
        endInput.value = today;
    } else if (val === 'this_year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startInput.value = startOfYear.toLocaleDateString('en-CA');
        endInput.value = today;
    }
    
    loadOrders();
}

// ===== Image Preview Logic (Add Form) =====
let selectedFiles = [];

// ===== Edit Image Preview Logic =====
let editSelectedFiles = [];
let editKeepImages = []; // tracks existing images to keep

function previewImages(event) {
    const files = Array.from(event.target.files);
    const MAX = 10;

    // Merge with already selected, cap at 10
    selectedFiles = [...selectedFiles, ...files].slice(0, MAX);

    // Update the file input with a DataTransfer object (to keep selected files in sync)
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    document.getElementById('imageInput').files = dt.files;

    renderPreviews();
}

function renderPreviews() {
    const grid = document.getElementById('imagePreviewGrid');
    const countEl = document.getElementById('imageCount');

    if (selectedFiles.length === 0) {
        grid.style.display = 'none';
        countEl.textContent = '';
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = '';
    countEl.textContent = `${selectedFiles.length} image(s) selected (max 10)`;

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-btn" onclick="removeImage(${index})" title="Remove">✕</button>
                ${index === 0 ? '<span style="position:absolute;bottom:2px;left:2px;background:rgba(236,72,153,0.85);color:white;font-size:9px;padding:1px 4px;border-radius:4px;">Main</span>' : ''}
            `;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedFiles.splice(index, 1);
    // Rebuild DataTransfer
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    document.getElementById('imageInput').files = dt.files;
    renderPreviews();
}

// ===== Edit Image Preview =====
function previewEditImages(event) {
    const files = Array.from(event.target.files);
    editSelectedFiles = files.slice(0, 10);
    const dt = new DataTransfer();
    editSelectedFiles.forEach(f => dt.items.add(f));
    document.getElementById('editImageInput').files = dt.files;
    renderEditNewPreviews();
}

function renderEditNewPreviews() {
    const grid = document.getElementById('editImagePreviewGrid');
    const countEl = document.getElementById('editImageCount');
    if (editSelectedFiles.length === 0) {
        grid.style.display = 'none';
        countEl.textContent = '';
        return;
    }
    grid.style.display = 'grid';
    grid.innerHTML = '';
    countEl.textContent = `${editSelectedFiles.length} new image(s) selected — will replace existing images`;
    editSelectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML = `
                <img src="${e.target.result}" alt="New ${index + 1}">
                ${index === 0 ? '<span style="position:absolute;bottom:2px;left:2px;background:rgba(236,72,153,0.85);color:white;font-size:9px;padding:1px 4px;border-radius:4px;">Main</span>' : ''}
            `;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function removeKeepImage(index) {
    editKeepImages.splice(index, 1);
    document.getElementById('edit_keep_images').value = JSON.stringify(editKeepImages);
    renderEditExistingImages();
}

function renderEditExistingImages() {
    const container = document.getElementById('edit_existing_images');
    container.innerHTML = '';
    if (editKeepImages.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400">No existing images.</p>';
        return;
    }
    editKeepImages.forEach((src, idx) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = `
            <img src="${src}" alt="Image ${idx + 1}">
            <button type="button" class="remove-btn" onclick="removeKeepImage(${idx})" title="Remove">✕</button>
            ${idx === 0 ? '<span style="position:absolute;bottom:2px;left:2px;background:rgba(236,72,153,0.85);color:white;font-size:9px;padding:1px 4px;border-radius:4px;">Main</span>' : ''}
        `;
        container.appendChild(item);
    });
    document.getElementById('edit_keep_images').value = JSON.stringify(editKeepImages);
}

// ===== Open Edit Modal =====
async function openEditModal(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const p = await res.json();

        // Fill form fields
        document.getElementById('edit_product_id').value = p.id;
        document.getElementById('edit_title').value = p.title || '';
        document.getElementById('edit_badge').value = p.badge || '';
        document.getElementById('edit_price').value = p.price || '';
        document.getElementById('edit_original_price').value = p.original_price || '';
        document.getElementById('edit_rating').value = p.rating || 4.9;
        if (document.getElementById('edit_stock')) document.getElementById('edit_stock').value = p.stock !== undefined ? p.stock : -1;
        document.getElementById('edit_description').value = p.description || '';
        document.getElementById('edit_offer_text').value = p.offer_text || '';

        // Sizes — convert array to comma string
        const sizesArr = Array.isArray(p.sizes) ? p.sizes : [];
        document.getElementById('edit_sizes').value = sizesArr.join(', ');

        // Existing images
        editKeepImages = Array.isArray(p.images) && p.images.length > 0
            ? [...p.images]
            : (p.image ? [p.image] : []);
        renderEditExistingImages();

        // Reset new image upload
        editSelectedFiles = [];
        document.getElementById('editImageInput').value = '';
        document.getElementById('editImagePreviewGrid').innerHTML = '';
        document.getElementById('editImagePreviewGrid').style.display = 'none';
        document.getElementById('editImageCount').textContent = '';

        // Load and set category dropdown
        await refreshEditModalCategories(p.category);

        toggleModal('editModal');
    } catch (err) {
        console.error('Error loading product for edit:', err);
        alert('Could not load product details.');
    }
}

// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on and only fetch necessary data
    if (document.getElementById('products-table-body')) fetchProducts();
    if (document.getElementById('users-table-body')) fetchUsers();
    if (document.getElementById('nav-table-body')) fetchNavLinks();
    if (document.getElementById('categories-table-body') || 
        document.getElementById('add_category_select') || 
        document.getElementById('edit_category_select')) fetchCategories();
    if (document.getElementById('banners-table-body')) fetchBanners();
    if (document.getElementById('orders-table-body')) {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            const searchInput = document.getElementById('order-search');
            if (searchInput) searchInput.value = q;
        }
        
        loadOrders();
        
        const openOrderId = params.get('open_order');
        if (openOrderId) {
            setTimeout(() => { openOrderDetail(openOrderId); }, 300);
        }
    }

    // Notification badge polling
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 30000); // every 30s

    // Highlight active nav based on current URL
    const currentPath = window.location.pathname;
    const navMapping = {
        'products.html': 'products',
        'users.html': 'users',
        'navigation.html': 'nav',
        'categories.html': 'categories',
        'banners.html': 'banners',
        'orders.html': 'orders'
    };

    Object.entries(navMapping).forEach(([path, section]) => {
        if (currentPath.includes(path)) {
            const btn = document.getElementById('nav-' + section);
            if (btn) {
                btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
                btn.classList.add('bg-pink-50', 'text-pink-600');
            }
        }
    });

    // Edit Product Form Submit
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_product_id').value;
            const formData = new FormData(editProductForm);
            // Remove the product_id field — it's in the URL
            formData.delete('product_id');

            try {
                const res = await fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    toggleModal('editModal');
                    fetchProducts();
                    showToast('Product updated successfully! ✅');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                console.error('Error updating product:', err);
                alert('Failed to update product.');
            }
        });
    }

    // Add Product Form Submit
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(addProductForm);

            try {
                const res = await fetch('/api/products', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (res.ok) {
                    toggleModal('addModal');
                    addProductForm.reset();
                    selectedFiles = [];
                    renderPreviews();
                    fetchProducts();
                    showToast('Product added successfully! ✅');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error('Error adding product:', error);
                alert('Failed to add product.');
            }
        });
    }

    // Add Nav Form Submit
    const addNavForm = document.getElementById('addNavForm');
    if (addNavForm) {
        addNavForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bodyData = {
                title: document.getElementById('nav_title').value,
                url: document.getElementById('nav_url').value,
                sort_order: parseInt(document.getElementById('nav_sort_order').value)
            };
            try {
                const res = await fetch('/api/admin/nav', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                });
                if (res.ok) {
                    toggleModal('addNavModal');
                    addNavForm.reset();
                    fetchNavLinks();
                    showToast('Navigation item added! ✅');
                } else {
                    alert('Failed to add navigation item.');
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // Add Category Form Submit
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('cat_name').value.trim();
            const icon = document.getElementById('cat_icon').value.trim() || '🏷️';
            try {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon })
                });
                const data = await res.json();
                if (res.ok) {
                    toggleModal('addCategoryModal');
                    addCategoryForm.reset();
                    document.getElementById('cat_icon').value = '🏷️';
                    fetchCategories();
                    showToast(`Category "${name}" added! ✅`);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to add category.');
            }
        });
    }

    // Edit Category Form Submit
    const editCategoryForm = document.getElementById('editCategoryForm');
    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_cat_id').value;
            const name = document.getElementById('edit_cat_name').value.trim();
            const icon = document.getElementById('edit_cat_icon').value.trim() || '🏷️';
            try {
                const res = await fetch(`/api/categories/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon })
                });
                const data = await res.json();
                if (res.ok) {
                    toggleModal('editCategoryModal');
                    fetchCategories();
                    fetchProducts(); // refresh since product categories may have changed
                    showToast(`Category updated! ✅`);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to update category.');
            }
        });
    }
    // Add Banner Form Submit
    const addBannerForm = document.getElementById('addBannerForm');
    if (addBannerForm) {
        addBannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addBannerForm);
            try {
                const res = await fetch('/api/banners', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    toggleModal('addBannerModal');
                    addBannerForm.reset();
                    fetchBanners();
                    showToast('Hero banner added! ✅');
                } else {
                    const data = await res.json();
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // Edit Banner Form Submit
    const editBannerForm = document.getElementById('editBannerForm');
    if (editBannerForm) {
        editBannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit_banner_id').value;
            const formData = new FormData(editBannerForm);
            try {
                const res = await fetch(`/api/banners/${id}`, {
                    method: 'PUT',
                    body: formData
                });
                if (res.ok) {
                    toggleModal('editBannerModal');
                    fetchBanners();
                    showToast('Hero banner updated! ✅');
                } else {
                    const data = await res.json();
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
});

// ===== Fetch & Render Products =====
async function fetchProducts() {
    try {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        const res = await fetch('/api/products');
        const products = await res.json();

        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400">No products yet. Click "+ Add New Product" to get started!</td></tr>`;
            return;
        }

        products.forEach(p => {
            const images = Array.isArray(p.images) ? p.images : [p.image];
            const displayImg = images[0] || p.image;
            const imgCount = images.length;

            const badgeHtml = p.badge
                ? `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeColor(p.badge)}">${p.badge}</span>`
                : '<span class="text-gray-300 text-xs">—</span>';

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
            tr.innerHTML = `
                <td class="p-4">
                    <div class="relative">
                        <img src="${displayImg}" alt="${p.title}" class="w-14 h-14 rounded-lg object-cover border border-gray-200">
                        ${imgCount > 1 ? `<span class="absolute -bottom-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">${imgCount}</span>` : ''}
                    </div>
                </td>
                <td class="p-4">
                    <p class="font-medium text-gray-800">${p.title}</p>
                    ${p.description ? `<p class="text-xs text-gray-400 mt-1 truncate max-w-xs">${p.description}</p>` : ''}
                    ${p.sizes ? `<p class="text-xs text-pink-400 mt-1">Sizes: ${JSON.parse(p.sizes || '[]').join(', ')}</p>` : ''}
                </td>
                <td class="p-4 text-gray-500">
                    <span class="px-2 py-1 bg-gray-100 rounded text-xs">${p.category}</span>
                </td>
                <td class="p-4">
                    <span class="font-medium text-pink-500">Rs. ${parseFloat(p.price).toFixed(2)}</span>
                    ${p.original_price ? `<br><del class="text-xs text-gray-400">Rs. ${parseFloat(p.original_price).toFixed(2)}</del>` : ''}
                </td>
                <td class="p-4">
                    ${p.stock === -1 || p.stock === null || p.stock === undefined 
                        ? '<span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">∞ Unlimited</span>' 
                        : p.stock === 0 
                            ? '<span class="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold">Out of Stock</span>' 
                            : p.stock <= 5 
                                ? `<span class="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">${p.stock} left ⚠️</span>` 
                                : `<span class="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full font-medium">${p.stock}</span>`
                    }
                </td>
                <td class="p-4">${badgeHtml}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <button onclick="openEditModal(${p.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Edit Product">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="deleteProduct(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete Product">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function getBadgeColor(badge) {
    const colors = {
        'New': 'bg-blue-100 text-blue-700',
        'Sale': 'bg-red-100 text-red-700',
        'Hot': 'bg-orange-100 text-orange-700',
        'Trending': 'bg-purple-100 text-purple-700',
        'Best Seller': 'bg-green-100 text-green-700',
        'Limited': 'bg-yellow-100 text-yellow-700'
    };
    return colors[badge] || 'bg-gray-100 text-gray-700';
}

// ===== Delete Product =====
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });

        if (res.ok) {
            fetchProducts();
            showToast('Product deleted.');
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product.');
    }
}

// ===== Toggle Modal =====
function toggleModal(modalID) {
    const modal = document.getElementById(modalID);
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}



// ===== Fetch Users =====
async function fetchUsers() {
    try {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const month = document.getElementById('user-month-filter')?.value || '';
        const year = document.getElementById('user-year-filter')?.value || '';

        const res = await fetch(`/api/users?month=${month}&year=${year}`);
        const users = await res.json();

        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500">No users found.</td></tr>`;
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
            tr.innerHTML = `
                <td class="p-4 font-medium text-gray-800">#${u.id}</td>
                <td class="p-4"><a href="user_details.html?email=${encodeURIComponent(u.email)}" class="hover:text-pink-600 hover:underline font-bold text-gray-800">${u.fullname}</a></td>
                <td class="p-4 text-gray-600">${u.email}</td>
                <td class="p-4 text-gray-500 text-xs">${new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Fetch users error:', err);
    }
}

// ===== Fetch Nav Links =====
async function fetchNavLinks() {
    try {
        const res = await fetch('/api/admin/nav');
        const navs = await res.json();

        const tbody = document.getElementById('nav-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!navs || navs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">No navigation items found.</td></tr>`;
            return;
        }

        navs.forEach(n => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
            tr.innerHTML = `
                <td class="p-4 font-medium text-gray-500">${n.sort_order}</td>
                <td class="p-4 font-medium text-gray-800">${n.title}</td>
                <td class="p-4 text-gray-500">${n.url}</td>
                <td class="p-4">
                    <button onclick="toggleNavStatus(${n.id}, ${n.is_active})" class="px-2 py-1 text-xs rounded ${n.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${n.is_active ? 'Visible' : 'Hidden'}
                    </button>
                </td>
                <td class="p-4 flex space-x-2">
                    <button onclick="deleteNav(${n.id})" class="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching nav links:', error);
    }
}

async function toggleNavStatus(id, currentStatus) {
    try {
        const res = await fetch(`/api/admin/nav/${id}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentStatus })
        });
        if (res.ok) fetchNavLinks();
    } catch (error) {
        console.error('Error toggling status:', error);
    }
}

async function deleteNav(id) {
    if (!confirm('Are you sure you want to delete this navigation link?')) return;
    try {
        const res = await fetch(`/api/admin/nav/${id}`, { method: 'DELETE' });
        if (res.ok) fetchNavLinks();
    } catch (error) {
        console.error('Error deleting nav link:', error);
    }
}

// ===== Toast Notification =====
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: #1f2937; color: white; padding: 12px 20px;
        border-radius: 10px; font-size: 14px; font-family: Poppins, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== CATEGORIES =====

async function fetchCategories() {
    try {
        // 1. Render in table
        const tbody = document.getElementById('categories-table-body');
        const addSelect = document.getElementById('add_category_select');
        const editSelect = document.getElementById('edit_category_select');

        // Only fetch if we need to display or populate dropdowns
        if (!tbody && !addSelect && !editSelect) return;

        const res = await fetch('/api/categories');
        const cats = await res.json();

        if (tbody) {
            tbody.innerHTML = '';
            if (cats.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No categories yet.</td></tr>`;
            } else {
                cats.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
                    tr.innerHTML = `
                        <td class="p-4 text-2xl">${c.icon || '🏷️'}</td>
                        <td class="p-4 font-medium text-gray-800">${c.name}</td>
                        <td class="p-4 text-center">
                            <span class="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-semibold">${c.product_count} product${c.product_count !== 1 ? 's' : ''}</span>
                        </td>
                        <td class="p-4">
                            <div class="flex items-center gap-2">
                                <button onclick="openEditCategoryModal(${c.id}, '${c.name.replace(/'/g, "\\'")}',' ${(c.icon || '🏷️').trim()}')" class="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onclick="deleteCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')"
                                    class="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // 2. Populate category dropdowns in Add + Edit product modals
        populateCategoryDropdown('add_category_select', cats, null);
        populateCategoryDropdown('edit_category_select', cats, null);

    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

function populateCategoryDropdown(selectId, cats, selectedValue) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select Category --</option>';
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = `${c.icon || ''} ${c.name}`;
        if (selectedValue && c.name === selectedValue) opt.selected = true;
        sel.appendChild(opt);
    });
}

function openEditCategoryModal(id, name, icon) {
    document.getElementById('edit_cat_id').value = id;
    document.getElementById('edit_cat_name').value = name.trim();
    document.getElementById('edit_cat_icon').value = icon.trim();
    toggleModal('editCategoryModal');
}

async function deleteCategory(id, name) {
    if (!confirm(`Delete category "${name}"? Products using this category will keep their category label but it won't appear in filters.`)) return;
    try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchCategories();
            showToast(`Category "${name}" deleted.`);
        } else {
            alert('Failed to delete category.');
        }
    } catch (err) {
        console.error(err);
    }
}

// Populate category dropdown after edit modal opens
async function refreshEditModalCategories(selectedCategory) {
    try {
        const catRes = await fetch('/api/categories');
        const cats = await catRes.json();
        populateCategoryDropdown('edit_category_select', cats, selectedCategory);
    } catch (err) {
        console.error('Error loading categories for edit modal:', err);
    }
}
// ===== BANNERS =====

async function fetchBanners() {
    try {
        const tbody = document.getElementById('banners-table-body');
        if (!tbody) return;

        const res = await fetch('/api/banners');
        const banners = await res.json();

        tbody.innerHTML = '';

        if (!banners || banners.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-400">No banners added. Click "+ Add New Banner" to get started!</td></tr>`;
            return;
        }

        banners.forEach(b => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';
            tr.innerHTML = `
                <td class="p-4">
                    <img src="${b.image_url}" class="w-24 h-12 rounded object-cover border border-gray-100">
                </td>
                <td class="p-4">
                    <p class="text-xs text-pink-500 font-semibold uppercase tracking-wider">${b.subtitle || ''}</p>
                    <p class="font-bold text-gray-800">${b.title}</p>
                    <p class="text-xs text-gray-500">${b.offer_text || ''}</p>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">${b.button_text}</span>
                    <p class="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">${b.link_url}</p>
                </td>
                <td class="p-4 text-center font-bold text-gray-400">${b.sort_order}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <button onclick="openEditBannerModal(${b.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Edit">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button onclick="deleteBanner(${b.id})" class="p-2 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error fetching banners:', err);
    }
}

async function openEditBannerModal(id) {
    try {
        const res = await fetch('/api/banners');
        const banners = await res.json();
        const b = banners.find(item => item.id == id);
        if (!b) return;

        document.getElementById('edit_banner_id').value = b.id;
        document.getElementById('edit_banner_title').value = b.title;
        document.getElementById('edit_banner_subtitle').value = b.subtitle || '';
        document.getElementById('edit_banner_offer_text').value = b.offer_text || '';
        document.getElementById('edit_banner_button_text').value = b.button_text || 'Shop Now';
        document.getElementById('edit_banner_link_url').value = b.link_url || '/shop.html';
        document.getElementById('edit_banner_sort_order').value = b.sort_order || 0;

        toggleModal('editBannerModal');
    } catch (err) {
        console.error(err);
    }
}

async function deleteBanner(id) {
    if (!confirm('Delete this banner?')) return;
    try {
        const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchBanners();
            showToast('Banner deleted.');
        } else {
            alert('Failed to delete banner.');
        }
    } catch (err) {
        console.error(err);
    }
}

// ===== ORDERS MANAGEMENT (PROFESSIONAL VERSION V3) =====
let currentOrdersPage = 1;
let ordersLimit = 10;
let ordersDebounceTimer;

function debounceLoadOrders() {
    clearTimeout(ordersDebounceTimer);
    ordersDebounceTimer = setTimeout(() => {
        currentOrdersPage = 1;
        loadOrders();
    }, 500);
}

async function loadOrders(page = 1) {
    currentOrdersPage = page;
    const status = document.getElementById('order-status-filter')?.value || '';
    const startDate = document.getElementById('order-start-date')?.value || '';
    const endDate = document.getElementById('order-end-date')?.value || '';
    const q = document.getElementById('order-search')?.value || '';
    const month = document.getElementById('order-month-filter')?.value || '';
    const year = document.getElementById('order-year-filter')?.value || '';
    
    try {
        const res = await fetch(`/api/admin/orders?status=${status}&startDate=${startDate}&endDate=${endDate}&month=${month}&year=${year}&q=${q}&page=${page}&limit=${ordersLimit}`);
        const data = await res.json();
        const orders = data.orders;
        const pagination = data.pagination;

        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-gray-400">No orders found.</td></tr>';
            document.getElementById('pagination-info').innerText = 'Showing 0 orders';
            document.getElementById('pagination-controls').innerHTML = '';
            return;
        }

        orders.forEach(o => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group';
            tr.onclick = () => openOrderDetail(o.id);
            tr.innerHTML = `
                <td class="p-4 font-bold text-pink-600 group-hover:underline">#${o.id}</td>
                <td class="p-4">
                    <p class="font-medium text-gray-800">${o.fullname}</p>
                    <p class="text-[10px] text-gray-400">${o.phone}</p>
                </td>
                <td class="p-4 font-medium text-gray-800">Rs. ${o.total_amount.toFixed(2)}</td>
                <td class="p-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">${o.payment_status || 'Pending'}</span>
                </td>
                <td class="p-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getOrderStatusColor(o.status)}">${o.status}</span>
                </td>
                <td class="p-4 text-xs text-gray-400">${new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td class="p-4 text-right">
                    <button class="text-pink-600 group-hover:text-pink-700 font-semibold text-xs transition-colors">View Details →</button>
                </td>`;
            tbody.appendChild(tr);
        });

        // Update Pagination Info
        const start = (pagination.currentPage - 1) * pagination.limit + 1;
        const end = Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders);
        document.getElementById('pagination-info').innerText = `Showing ${start} to ${end} of ${pagination.totalOrders} orders`;

        // Update Pagination Controls
        renderPagination(pagination);

    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';

    if (pagination.totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-3 py-1 rounded border text-xs font-medium transition ${pagination.currentPage === 1 ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`;
    prevBtn.innerText = 'Previous';
    if (pagination.currentPage > 1) prevBtn.onclick = () => loadOrders(pagination.currentPage - 1);
    container.appendChild(prevBtn);

    // Page Numbers (Simplified)
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === 1 || i === pagination.totalPages || (i >= pagination.currentPage - 1 && i <= pagination.currentPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `w-8 h-8 rounded border text-xs font-medium transition ${pagination.currentPage === i ? 'bg-pink-500 text-white border-pink-500' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`;
            pageBtn.innerText = i;
            pageBtn.onclick = () => loadOrders(i);
            container.appendChild(pageBtn);
        } else if (i === pagination.currentPage - 2 || i === pagination.currentPage + 2) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'text-gray-400 px-1';
            container.appendChild(dots);
        }
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-3 py-1 rounded border text-xs font-medium transition ${pagination.currentPage === pagination.totalPages ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`;
    nextBtn.innerText = 'Next';
    if (pagination.currentPage < pagination.totalPages) nextBtn.onclick = () => loadOrders(pagination.currentPage + 1);
    container.appendChild(nextBtn);
}

let currentOrderData = null;

async function openOrderDetail(id) {
    try {
        const res = await fetch('/api/admin/orders/' + id);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        currentOrderData = data; // Store for invoice printing
        const order = data.order;
        const items = data.items;
        const tracking = data.tracking;

        // Header
        document.getElementById('detail-order-id').innerText = '#' + order.id;
        document.getElementById('detail-order-date').innerText = new Date(order.created_at).toLocaleString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
        }) + ' from Online Store';

        // Invoice Sent Status
        const invoiceSentEl = document.getElementById('detail-invoice-sent');
        if (order.invoice_sent_at) {
            invoiceSentEl.innerText = 'Invoice sent on ' + new Date(order.invoice_sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            invoiceSentEl.classList.remove('hidden');
        } else {
            invoiceSentEl.classList.add('hidden');
        }

        // Status Badge (Main)
        const statusBadge = document.getElementById('detail-status-badge');
        if (statusBadge) {
            statusBadge.innerText = order.status;
            statusBadge.className = 'status-badge ' + getOrderStatusColor(order.status);
        }

        // Payment Badge
        const paymentBadge = document.getElementById('detail-payment-badge');
        paymentBadge.innerText = order.payment_status || 'Payment pending';
        paymentBadge.className = 'status-badge ' + (order.payment_status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200');

        // Fulfillment Badge
        const fulfillmentBadge = document.getElementById('detail-fulfillment-badge');
        const isFulfilled = (order.status === 'Delivered');
        fulfillmentBadge.innerText = isFulfilled ? 'Fulfilled' : (order.status === 'Cancelled' ? 'Cancelled' : 'Unfulfilled');
        fulfillmentBadge.className = 'status-badge ' + (isFulfilled ? 'bg-green-100 text-green-700 border border-green-200' : (order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'));

        // Fulfillment Card
        document.getElementById('fulfillment-card-title').innerText = (isFulfilled ? 'Fulfilled' : 'Items') + ' (' + items.length + ')';
        const itemsList = document.getElementById('detail-items-list');
        itemsList.innerHTML = items.map(item => `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><img src="${item.image || '/assets/images/placeholder.png'}" class="w-12 h-12 rounded border border-gray-100 object-cover"><div><p class="text-sm font-medium text-blue-600 hover:underline cursor-pointer">${item.name}</p><p class="text-[11px] text-gray-400">SKU: Sewing-${order.id}-${item.id} / Standard</p></div></div><div class="text-sm text-right"><p class="font-medium text-gray-800">Rs. ${(item.price * item.quantity).toFixed(2)}</p><p class="text-[10px] text-gray-400">Rs. ${parseFloat(item.price).toFixed(2)} × ${item.quantity}</p></div></div>`).join('');

        // Amazon-style Tracking Update
        updateTrackingUI(order.status);

        // Smart Action Buttons
        renderSmartActionButtons(order);

        // Status Stepper
        const stepper = document.getElementById('order-status-stepper');
        stepper.value = order.status;
        
        // Payment Summary
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        document.getElementById('detail-subtotal-label').innerText = 'Subtotal (' + items.length + ' item' + (items.length !== 1 ? 's' : '') + ')';
        document.getElementById('detail-subtotal-value').innerText = 'Rs. ' + subtotal.toFixed(2);
        document.getElementById('detail-shipping-value').innerText = 'Rs. ' + parseFloat(order.delivery_charge || 0).toFixed(2);
        document.getElementById('detail-total-value').innerText = 'Rs. ' + parseFloat(order.total_amount).toFixed(2);
        
        const isPaid = order.payment_status === 'Paid';
        document.getElementById('detail-paid-value').innerText = 'Rs. ' + (isPaid ? parseFloat(order.total_amount).toFixed(2) : '0.00');
        document.getElementById('detail-balance-value').innerText = 'Rs. ' + (isPaid ? '0.00' : parseFloat(order.total_amount).toFixed(2));
        document.getElementById('detail-payment-status-text').innerText = isPaid ? 'Paid' : 'Payment pending';
        
        const markAsPaidBtn = document.getElementById('mark-as-paid-btn');
        if (markAsPaidBtn) {
            if (isPaid) markAsPaidBtn.classList.add('hidden');
            else markAsPaidBtn.classList.remove('hidden');
        }

        // Sidebar (Customer Info)
        const nameEl = document.getElementById('sidebar-customer-name');
        if (nameEl) nameEl.innerText = order.fullname;
        
        const emailEl = document.getElementById('sidebar-customer-email');
        if (emailEl) emailEl.innerText = order.email || 'No email provided';
        
        const phoneEl = document.getElementById('sidebar-customer-phone');
        if (phoneEl) phoneEl.innerText = order.phone;
        
        // Insights
        const payPrefEl = document.getElementById('insight-payment-pref');
        if (payPrefEl) payPrefEl.innerText = `Preferred Method: ${order.payment_method}`;
        
        const locationParts = (order.address || '').split(',');
        const city = locationParts[locationParts.length - 1]?.trim() || 'India';
        const locEl = document.getElementById('insight-location');
        if (locEl) locEl.innerText = `Based in ${city}`;

        const addrLines = (order.address || '').split(',').map(l => l.trim());
        const shippingAddrEl = document.getElementById('sidebar-shipping-address');
        if (shippingAddrEl) shippingAddrEl.innerHTML = `<strong>${order.fullname}</strong><br>` + addrLines.join('<br>');

        // Map Link
        const mapLink = document.getElementById('view-map-link');
        if (mapLink) {
            mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address || '')}`;
            mapLink.target = '_blank';
        }

        // Fetch customer order count
        fetchCustomerStats(order.user_id, order.phone);

        const timelineHistory = document.getElementById('detail-timeline-history');
        if (timelineHistory) {
            // Filter out redundant Delivered entries or multiple similar status changes
            let lastStatus = '';
            const filteredTracking = (tracking || []).filter(t => {
                if (t.status === lastStatus && t.status !== 'Note') return false;
                lastStatus = t.status;
                return true;
            });

            timelineHistory.innerHTML = filteredTracking.map(t => `
                <div class="relative pb-6 last:pb-0">
                    <div class="absolute -left-[26px] mt-1 w-2.5 h-2.5 rounded-full ${t.status === 'Cancelled' ? 'bg-red-400' : (t.status === 'Note' ? 'bg-gray-400' : 'bg-pink-400')} border-2 border-white shadow-sm"></div>
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-semibold text-gray-700">${t.status === 'Note' ? 'Admin Note' : t.status}</p>
                            ${t.note ? `<p class="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded border border-gray-100">${t.note}</p>` : ''}
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-gray-400 font-medium uppercase">${new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p class="text-[9px] text-gray-300 font-medium">${new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>`).reverse().join(''); 
        }

        // Update Comment Box Placeholder Avatar
        const avatar = document.querySelector('.bg-pink-100.text-pink-600.font-bold') || document.querySelector('.bg-green-500.text-white.font-bold');
        if (avatar) avatar.innerText = (order.fullname || 'A')[0].toUpperCase();

        // Ensure modal is visible
        const modal = document.getElementById('orderDetailModal');
        if (modal) modal.classList.remove('hidden');
    } catch (err) {
        console.error("Error in openOrderDetail:", err);
        alert('Could not load order details: ' + err.message);
    }
}

function updateTrackingUI(status) {
    const steps = {
        'Order Placed': { width: '0%', active: ['placed'] },
        'Processing': { width: '25%', active: ['placed', 'processing'] },
        'Shipped': { width: '50%', active: ['placed', 'processing', 'shipped'] },
        'Out for Delivery': { width: '75%', active: ['placed', 'processing', 'shipped', 'delivery'] },
        'Delivered': { width: '100%', active: ['placed', 'processing', 'shipped', 'delivery', 'delivered'] },
        'Cancelled': { width: '0%', active: [] }
    };

    const config = steps[status] || steps['Order Placed'];
    const bar = document.getElementById('tracking-progress-bar');
    if (bar) bar.style.width = config.width;
    
    document.getElementById('tracking-status-text').innerText = status;
    if (status === 'Cancelled') document.getElementById('tracking-status-text').className = 'text-xs font-bold text-red-600 uppercase tracking-widest';

    const allSteps = ['placed', 'processing', 'shipped', 'delivery', 'delivered'];
    allSteps.forEach(s => {
        const el = document.getElementById('step-' + s);
        if (el) {
            if (config.active.includes(s)) {
                el.className = 'w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 scale-110';
            } else {
                el.className = 'w-8 h-8 rounded-full bg-gray-200 text-white flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500';
            }
        }
    });
}

function renderSmartActionButtons(order) {
    const container = document.getElementById('status-action-buttons');
    if (!container) return;
    container.innerHTML = '';

    const validTransitions = {
        'Order Placed': { next: 'Processing', label: 'Start Processing', color: 'bg-blue-600' },
        'Processing': { next: 'Shipped', label: 'Mark as Shipped', color: 'bg-indigo-600' },
        'Shipped': { next: 'Out for Delivery', label: 'Out for Delivery', color: 'bg-purple-600' },
        'Out for Delivery': { next: 'Delivered', label: 'Confirm Delivery', color: 'bg-green-600' }
    };

    const config = validTransitions[order.status];
    if (config) {
        const btn = document.createElement('button');
        btn.className = `${config.color} text-white text-[11px] font-bold px-3 py-1.5 rounded shadow-sm hover:opacity-90 transition`;
        btn.innerText = config.label;
        btn.onclick = (e) => {
            e.stopPropagation();
            updateOrderStatus(config.next);
        };
        container.appendChild(btn);
    }

    if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = `bg-white border border-red-200 text-red-500 text-[11px] font-bold px-3 py-1.5 rounded hover:bg-red-50 transition`;
        cancelBtn.innerText = 'Cancel Order';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            updateOrderStatus('Cancelled');
        };
        container.appendChild(cancelBtn);
    }
}


async function sendInvoiceEmail() {
    const orderId = document.getElementById('detail-order-id').innerText.replace('#', '');
    const btn = document.getElementById('btn-send-invoice');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2 text-pink-600" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending...';

    try {
        const res = await fetch(`/api/admin/orders/${orderId}/send-invoice`, { method: 'POST' });
        if (res.ok) {
            showToast('Invoice sent to customer email! 📧');
            openOrderDetail(orderId); // Refresh to show sent date
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to send invoice.');
        }
    } catch (err) {
        console.error(err);
        alert('Error sending invoice.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function prepareInvoicePrint() {
    if (!currentOrderData) return;
    const { order, items } = currentOrderData;
    
    document.getElementById('print-order-id').innerText = order.id;
    document.getElementById('print-customer-name').innerText = order.fullname;
    document.getElementById('print-customer-address').innerText = order.address;
    document.getElementById('print-customer-email').innerText = order.email || '-';
    document.getElementById('print-customer-phone').innerText = order.phone;
    document.getElementById('print-order-date').innerText = new Date(order.created_at).toLocaleDateString();
    document.getElementById('print-payment-method').innerText = order.payment_method;
    document.getElementById('print-payment-status').innerText = order.payment_status;
    
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    document.getElementById('print-subtotal').innerText = 'Rs. ' + subtotal.toFixed(2);
    document.getElementById('print-shipping').innerText = 'Rs. ' + parseFloat(order.delivery_charge || 0).toFixed(2);
    document.getElementById('print-total').innerText = 'Rs. ' + parseFloat(order.total_amount).toFixed(2);
    
    const itemsTbody = document.getElementById('print-items-list');
    itemsTbody.innerHTML = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');
}

function printInvoice() {
    prepareInvoicePrint();
    const printArea = document.getElementById('invoice-print-area');
    const originalContent = document.body.innerHTML;
    
    // Create a new window for printing to avoid messing up the main UI
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice #${currentOrderData.order.id}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', sans-serif; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${printArea.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

async function downloadInvoice() {
    prepareInvoicePrint();
    const printArea = document.getElementById('invoice-print-area');
    printArea.classList.remove('hidden'); // Temporarily show to capture
    
    const { jsPDF } = window.jspdf;
    
    try {
        const canvas = await html2canvas(printArea, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${currentOrderData.order.id}.pdf`);
        showToast('Invoice PDF downloaded! 📥');
    } catch (err) {
        console.error(err);
        alert('Error generating PDF.');
    } finally {
        printArea.classList.add('hidden');
    }
}


// ===== COURIER LABEL GENERATOR (B&W Professional) =====
async function downloadCourierLabel() {
    if (!currentOrderData) return;
    const { order, items } = currentOrderData;

    // ── AWB / Tracking number (padded order ID)
    const awbNum = 'DSP' + String(order.id).padStart(9, '0');
    const barcodeVal = awbNum;

    // Header fields
    document.getElementById('lbl-awb').innerText      = awbNum;
    document.getElementById('lbl-order-num').innerText = '#' + order.id;
    document.getElementById('lbl-order-date').innerText =
        new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('lbl-order-date2').innerText =
        new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('lbl-pkg-count').innerText = '1 / 1';

    // Barcode
    try {
        JsBarcode('#lbl-barcode', barcodeVal, {
            format: 'CODE128',
            width: 1.8,
            height: 44,
            displayValue: false,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
        });
        document.getElementById('lbl-barcode-num').innerText = barcodeVal;
    } catch(e) { console.warn('Barcode error:', e); }

    // Payment row
    document.getElementById('lbl-payment-method').innerText    = order.payment_method || 'COD';
    const isPaid = order.payment_status === 'Paid';
    document.getElementById('lbl-payment-status-lbl').innerText = isPaid ? 'PAID ✓' : 'PENDING';

    // TO address — extract pincode & city/state from address
    document.getElementById('lbl-to-name').innerText   = order.fullname;
    document.getElementById('lbl-to-phone').innerText  = order.phone;
    const altPhone = order.alternate_phone || order.phone2 || '';
    const p2el = document.getElementById('lbl-to-phone2');
    p2el.innerText = altPhone ? 'Alt: ' + altPhone : '';
    document.getElementById('lbl-to-email').innerText  = order.email || '';

    // Smart address parsing — extract PIN and city/state
    const fullAddr     = order.address || '';
    const pinMatch     = fullAddr.match(/\b(\d{6})\b/);
    const pincode      = pinMatch ? pinMatch[1] : '';
    // Try to get city & state from address parts
    const addrParts    = fullAddr.split(',').map(s => s.trim()).filter(Boolean);
    // Remove the part that is or contains the pincode
    const addrNoPin    = addrParts.filter(p => !p.match(/^\d{6}$/));
    // Last 2 parts are usually city, state
    const cityState    = addrNoPin.slice(-2).join(', ');
    // Remaining parts are the street address
    const streetLines  = addrNoPin.slice(0, -2);

    document.getElementById('lbl-pincode').innerText    = pincode || '—';
    document.getElementById('lbl-city-state').innerText = cityState;
    // Show street + city (without pincode repeat) in address block
    document.getElementById('lbl-to-address').innerText = addrNoPin.join('\n');

    // Items table (# | ITEM/SKU | QTY | UNIT PRICE | TOTAL)
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping  = parseFloat(order.delivery_charge || 0);
    const discount  = parseFloat(order.discount || 0);
    const total     = parseFloat(order.total_amount);

    document.getElementById('lbl-items-table').innerHTML = items.map((item, i) => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:2px 0; color:#555; font-size:7px;">${i + 1}</td>
            <td style="padding:2px 3px; font-weight:700; font-size:7.5px;">${item.name}</td>
            <td style="padding:2px 3px; text-align:center; font-size:7.5px;">${item.quantity}</td>
            <td style="padding:2px 0; text-align:right; font-size:7px; color:#555;">Rs.${parseFloat(item.price).toFixed(0)}</td>
            <td style="padding:2px 0; text-align:right; font-weight:700; font-size:7.5px; padding-left:4px;">Rs.${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    ).join('');

    // Totals
    const totalQty = items.reduce((a, b) => a + b.quantity, 0);
    document.getElementById('lbl-subtotal').innerText      = 'Rs.' + subtotal.toFixed(2);
    document.getElementById('lbl-shipping').innerText      = shipping > 0 ? 'Rs.' + shipping.toFixed(2) : 'FREE';
    document.getElementById('lbl-discount').innerText      = discount > 0 ? '- Rs.' + discount.toFixed(2) : '—';
    document.getElementById('lbl-total').innerText         = 'Rs.' + total.toFixed(2);
    document.getElementById('lbl-declared-value').innerText = 'Rs.' + subtotal.toFixed(2);
    document.getElementById('lbl-item-count-box').innerText = totalQty + ' Pc';
    document.getElementById('lbl-items-count').innerText   = `${totalQty} item(s)  ·  Pkg 1/1  ·  ${order.payment_method || 'COD'}`;

    // COD / Paid Amount Box
    const codLabelRow  = document.getElementById('lbl-cod-label-row');
    const codTitle     = document.getElementById('lbl-cod-title');
    const codAmount    = document.getElementById('lbl-cod-amount');
    const codNote      = document.getElementById('lbl-cod-note');
    const paidTitle    = document.getElementById('lbl-paid-title');
    const paidAmount   = document.getElementById('lbl-paid-amount');
    const paidNote     = document.getElementById('lbl-paid-note');
    const tblPaid      = document.getElementById('lbl-tbl-paid');
    const tblCollect   = document.getElementById('lbl-tbl-collect');

    if (!isPaid) {
        codLabelRow.innerText  = '*** CASH ON DELIVERY — COLLECT FROM CUSTOMER ***';
        codTitle.innerText     = 'Collectible Amount';
        codAmount.innerText    = 'Rs.' + total.toFixed(2);
        codNote.innerText      = 'Please collect exact amount at delivery';
        paidTitle.innerText    = 'Amount Paid Online';
        paidAmount.innerText   = 'Rs.0.00';
        paidNote.innerText     = 'Not paid in advance';
        tblPaid.innerText      = 'Rs.0.00';
        tblCollect.innerText   = 'Rs.' + total.toFixed(2);
    } else {
        codLabelRow.innerText  = '*** PREPAID — DO NOT COLLECT ANY AMOUNT ***';
        codTitle.innerText     = 'Amount Paid Online';
        codAmount.innerText    = 'Rs.' + total.toFixed(2);
        codNote.innerText      = 'Payment received — do not collect';
        paidTitle.innerText    = 'Collectible Amount';
        paidAmount.innerText   = 'Rs.0.00';
        paidNote.innerText     = 'Nothing to collect';
        tblPaid.innerText      = 'Rs.' + total.toFixed(2);
        tblCollect.innerText   = 'Rs.0.00';
    }

    // Footer
    document.getElementById('lbl-footer-order-id').innerText = order.id;
    document.getElementById('lbl-footer-awb').innerText      = awbNum;
    document.getElementById('lbl-generated-date').innerText  =
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // QR Code
    const qrContainer = document.getElementById('lbl-qr-container');
    qrContainer.innerHTML = '';
    const qrText = [
        'ORDER:' + order.id,
        'AWB:' + awbNum,
        'TO:' + order.fullname,
        'PH:' + order.phone,
        'PIN:' + pincode,
        'CITY:' + cityState,
        'AMT:Rs.' + total.toFixed(2),
        'PAY:' + (order.payment_method || 'COD'),
        'STATUS:' + (order.payment_status || 'Pending')
    ].join('|');

    try {
        new QRCode(qrContainer, {
            text: qrText,
            width: 76,
            height: 76,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch(e) { console.warn('QR error:', e); }

    // ── Render off-screen then capture
    const labelArea = document.getElementById('courier-label-area');
    const labelInner = document.getElementById('courier-label-inner');

    // Position off-screen
    labelArea.style.position = 'fixed';
    labelArea.style.top = '-9999px';
    labelArea.style.left = '-9999px';
    labelArea.style.zIndex = '-1';
    labelArea.classList.remove('hidden');

    // Wait for QR + barcode to fully paint
    await new Promise(r => setTimeout(r, 700));

    try {
        // scale:2 → 384px becomes 768px = exactly 4 inches at 192dpi
        const canvas = await html2canvas(labelInner, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        const { jsPDF } = window.jspdf;

        // ✅ Exact 4×6 inch label — standard thermal printer size
        const pageW = 101.6;   // 4 inches in mm
        const pageH = 152.4;   // 6 inches in mm

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pageW, pageH],
        });

        const imgData  = canvas.toDataURL('image/png');
        // Scale image to fit full 4" width, height proportional (no stretch)
        const scaledH  = (canvas.height / canvas.width) * pageW;

        pdf.addImage(imgData, 'PNG', 0, 0, pageW, scaledH);
        pdf.save(`CourierLabel_${awbNum}.pdf`);

        showToast('Label downloaded! 4×6 inch 🏷️');
    } catch(err) {
        console.error('Label PDF error:', err);
        alert('Error generating label. Please try again.');
    } finally {
        labelArea.classList.add('hidden');
        labelArea.style.position = '';
        labelArea.style.top = '';
        labelArea.style.left = '';
        labelArea.style.zIndex = '';
    }
}


async function fetchCustomerStats(userId, phone) {
    try {
        const res = await fetch(`/api/admin/customers/stats?phone=${phone}`);
        const stats = await res.json();
        
        const countEl = document.getElementById('sidebar-order-count');
        if (countEl) countEl.innerText = stats.order_count + (stats.order_count === 1 ? ' order' : ' orders');
        
        const statusEl = document.getElementById('insight-order-status');
        if (statusEl) statusEl.innerText = stats.order_count === 1 ? 'First-time customer' : 'Repeat customer';
        
        const historyEl = document.getElementById('insight-order-history');
        if (historyEl) historyEl.innerText = `Total orders: ${stats.order_count}`;
        
    } catch (err) {
        console.error('Stats fetch error:', err);
    }
}

async function addTimelineComment() {
    const noteEl = document.getElementById('timeline-comment');
    const note = noteEl.value;
    const orderId = document.getElementById('detail-order-id').innerText.replace('#', '');
    if (!note.trim()) return;

    try {
        const res = await fetch('/api/admin/orders/' + orderId + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Internal Note', note: note })
        });
        if (res.ok) {
            noteEl.value = '';
            openOrderDetail(orderId); 
            showToast('Comment posted! 💬');
        }
    } catch (err) {
        console.error(err);
    }
}

async function updateOrderStatus(newStatus) {
    const orderId = document.getElementById('detail-order-id').innerText.replace('#', '');
    const currentStatus = currentOrderData.order.status;
    
    // Status Flow Validation
    const statusOrder = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    if (newStatus !== 'Cancelled' && currentIndex !== -1 && newIndex !== -1 && newIndex < currentIndex) {
        if (!confirm(`Warning: You are moving the status backwards from "${currentStatus}" to "${newStatus}". Continue?`)) {
            document.getElementById('order-status-stepper').value = currentStatus;
            return;
        }
    }

    if (!confirm('Change order status to ' + newStatus + '?')) {
        document.getElementById('order-status-stepper').value = currentStatus;
        return;
    }

    try {
        const res = await fetch('/api/admin/orders/' + orderId + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, note: 'Status updated manually by admin.' })
        });
        if (res.ok) {
            showToast('Status updated to ' + newStatus + '! ✅');
            // Small delay to ensure DB is updated before refreshing
            setTimeout(() => {
                openOrderDetail(orderId);
                loadOrders(currentOrdersPage);
            }, 500);
        } else {
            const errData = await res.json();
            alert('Error updating status: ' + (errData.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Critical error: ' + err.message);
    }
}

async function updatePaymentStatus(newStatus) {
    const orderId = document.getElementById('detail-order-id').innerText.replace('#', '');
    if (!confirm('Mark as ' + newStatus + '?')) return;
    try {
        const res = await fetch('/api/admin/orders/' + orderId + '/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, note: 'Payment status updated manually.' })
        });
        if (res.ok) {
            showToast('Payment marked as ' + newStatus + '! 💰');
            openOrderDetail(orderId);
            loadOrders(currentOrdersPage);
        }
    } catch (err) {
        console.error(err);
    }
}

function getOrderStatusColor(status) {
    const colors = {
        'Order Placed': 'bg-pink-100 text-pink-700 border border-pink-200',
        'Processing': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        'Shipped': 'bg-blue-100 text-blue-700 border border-blue-200',
        'Delivered': 'bg-green-100 text-green-700 border border-green-200',
        'Cancelled': 'bg-red-100 text-red-700 border border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll("#admin-sidebar a");
    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href && href !== "/" && currentPath.includes(href)) {
            // Remove inactive classes
            link.classList.remove("text-gray-600", "hover:bg-gray-50", "hover:text-gray-900");
            // Add active classes
            link.classList.add("bg-pink-50", "text-pink-700");
            
            // Also change svg icon color
            const svg = link.querySelector("svg");
            if (svg) {
                svg.classList.remove("text-gray-400", "group-hover:text-gray-500");
                svg.classList.add("text-pink-500");
            }
        } else if (href === "index.html" && currentPath.endsWith("/admin/")) {
            // Special case for root /admin/ pointing to index.html
            link.classList.remove("text-gray-600", "hover:bg-gray-50", "hover:text-gray-900");
            link.classList.add("bg-pink-50", "text-pink-700");
            const svg = link.querySelector("svg");
            if (svg) {
                svg.classList.remove("text-gray-400", "group-hover:text-gray-500");
                svg.classList.add("text-pink-500");
            }
        }
    });
});

// ===== Notification Badge =====
async function updateNotificationBadge() {
    try {
        const res = await fetch('/api/admin/notifications/count');
        if (!res.ok) return;
        const data = await res.json();
        
        // Update sidebar order badge
        const badge = document.getElementById('sidebar-order-badge');
        if (badge) {
            badge.textContent = data.pending_orders || 0;
            badge.style.display = (data.pending_orders > 0) ? '' : 'none';
        }
        
        // Update pending count on dashboard
        const pendingEl = document.getElementById('pending-orders-count');
        if (pendingEl) pendingEl.textContent = data.pending_orders || 0;
    } catch (err) { /* silent */ }
}

// ===== Export Orders CSV =====
function exportOrdersCSV() {
    const statusEl = document.getElementById('order-status-filter');
    const startEl = document.getElementById('order-start-date');
    const endEl = document.getElementById('order-end-date');
    const monthEl = document.getElementById('order-month-filter');
    const yearEl = document.getElementById('order-year-filter');
    
    let params = new URLSearchParams();
    if (statusEl && statusEl.value) params.set('status', statusEl.value);
    if (startEl && startEl.value) params.set('startDate', startEl.value);
    if (endEl && endEl.value) params.set('endDate', endEl.value);
    if (monthEl && monthEl.value) params.set('month', monthEl.value);
    if (yearEl && yearEl.value) params.set('year', yearEl.value);
    
    window.open('/api/admin/orders/export/csv?' + params.toString(), '_blank');
    showToast('Exporting orders to CSV... 📊');
}

// ===== WhatsApp Notify =====
async function sendWhatsAppNotify(orderId) {
    try {
        const res = await fetch(`/api/admin/whatsapp-notify/${orderId}`);
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
    } catch (err) { console.error(err); }
}

// ===== Admin Logout =====
function adminLogout() {
    fetch('/api/admin/logout', { method: 'POST' }).then(() => {
        window.location.href = '/admin/login.html';
    });
}