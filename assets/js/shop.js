let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        allProducts = await res.json();
        
        initializeFilters();

        // Check for URL search parameter
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery) {
            const filtered = allProducts.filter(p => 
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
            renderShopProducts(filtered);
        } else {
            renderShopProducts(allProducts);
        }
    } catch (error) {
        console.error('Error loading shop products:', error);
        document.getElementById('shop-product-grid').innerHTML = '<p>Failed to load products.</p>';
    }
});

function initializeFilters() {
    // 1. Get unique categories
    const categories = [...new Set(allProducts.map(p => p.category))];
    const categoryContainer = document.getElementById('category-filters');
    
    if (categoryContainer && categories.length > 0) {
        categoryContainer.innerHTML = '';
        
        // Check for URL category parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategory = urlParams.get('category');

        categories.forEach(cat => {
            const wrapper = document.createElement('label');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.cursor = 'pointer';
            
            const isChecked = urlCategory === cat ? 'checked' : '';
            
            wrapper.innerHTML = `
                <input type="checkbox" value="${cat}" class="category-checkbox" style="width: 16px; height: 16px; accent-color: var(--salmon-pink);" ${isChecked}>
                <span>${cat}</span>
            `;
            categoryContainer.appendChild(wrapper);
        });
        
        // Add event listeners to newly created checkboxes
        document.querySelectorAll('.category-checkbox').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });
        
        // If a category was in the URL, apply the filter immediately
        if (urlCategory) {
             setTimeout(applyFilters, 0); 
        }
    }

    // 2. Setup Price Slider
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');
    
    if (priceSlider && priceDisplay && allProducts.length > 0) {
        // Find max price dynamically
        const maxDbPrice = Math.max(...allProducts.map(p => parseFloat(p.price)));
        const roundedMax = Math.ceil(maxDbPrice / 10) * 10; // Round to nearest 10
        
        priceSlider.max = roundedMax;
        priceSlider.value = roundedMax;
        priceDisplay.innerText = `Rs. ${roundedMax}`;
        
        priceSlider.addEventListener('input', (e) => {
            priceDisplay.innerText = `Rs. ${e.target.value}`;
            applyFilters();
        });
    }
}

function applyFilters() {
    // Determine active categories
    const activeCheckboxes = document.querySelectorAll('.category-checkbox:checked');
    const activeCategories = Array.from(activeCheckboxes).map(cb => cb.value);
    
    // Determine max price
    const maxPrice = parseFloat(document.getElementById('price-slider').value) || 9999;
    
    // Filter the internal array
    const filteredProducts = allProducts.filter(p => {
        // Price check
        if (parseFloat(p.price) > maxPrice) return false;
        
        // Category check (if none selected, show all)
        if (activeCategories.length > 0 && !activeCategories.includes(p.category)) {
            return false;
        }
        
        return true;
    });
    
    // Trigger render
    renderShopProducts(filteredProducts);
}

function renderShopProducts(products) {
    const grid = document.getElementById('shop-product-grid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="padding: 20px;">No products match your filters.</p>';
        return;
    }

    grid.innerHTML = '';
    products.forEach(p => {
        const isOutOfStock = p.stock === 0;
        const markup = `
            <div class="showcase" ${isOutOfStock ? 'style="opacity:0.7"' : ''}>
                <div class="showcase-banner">
                    <a href="/product.html?id=${p.id}" style="display:block;">
                        <img src="${p.image}" alt="${p.title}" class="product-img default" style="height:300px; object-fit:cover;">
                        <img src="${p.image}" alt="${p.title}" class="product-img hover" style="height:300px; object-fit:cover;">
                    </a>
                    ${isOutOfStock 
                        ? '<p class="showcase-badge angle black" style="background:#ef4444;">Out of Stock</p>' 
                        : (p.original_price ? `<p class="showcase-badge angle black">sale</p>` : `<p class="showcase-badge angle pink">new</p>`)}
                    
                    <div class="showcase-actions">

                        <button class="btn-action" onclick="window.location.href='/product.html?id=${p.id}'"><ion-icon name="eye-outline"></ion-icon></button>
                        <button class="btn-action"><ion-icon name="repeat-outline"></ion-icon></button>
                        <button class="btn-action add-to-cart-btn" data-id="${p.id}" data-title="${p.title}" data-price="${p.price}" data-image="${p.image}" ${isOutOfStock ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
                            <ion-icon name="${isOutOfStock ? 'close-circle-outline' : 'bag-add-outline'}"></ion-icon>
                        </button>
                    </div>
                </div>

                <div class="showcase-content">
                    <a href="/product.html?id=${p.id}" class="showcase-category">${p.category}</a>
                    <h3><a href="/product.html?id=${p.id}" class="showcase-title">${p.title}</a></h3>
                    
                    <div class="showcase-rating">
                        <ion-icon name="star"></ion-icon>
                        <ion-icon name="star"></ion-icon>
                        <ion-icon name="star"></ion-icon>
                        <ion-icon name="star"></ion-icon>
                        <ion-icon name="star-outline"></ion-icon>
                    </div>

                    <div class="price-box">
                        <p class="price">Rs. ${parseFloat(p.price).toFixed(2)}</p>
                        ${p.original_price ? `<del>Rs. ${parseFloat(p.original_price).toFixed(2)}</del>` : ''}
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += markup;
    });
}
