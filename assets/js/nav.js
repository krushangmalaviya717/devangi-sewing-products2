async function loadDynamicNav() {
    try {
        const res = await fetch('/api/nav');
        const navItems = await res.json();
        
        const desktopNav = document.getElementById('dynamic-desktop-nav');
        const mobileNav = document.getElementById('dynamic-mobile-nav');
        
        let navHtml = '';
        navItems.forEach(item => {
            navHtml += `
                <li class="menu-category">
                    <a href="${item.url}" class="menu-title">${item.title}</a>
                </li>
            `;
        });
        
        if (desktopNav) desktopNav.innerHTML = navHtml;
        if (mobileNav) mobileNav.innerHTML = navHtml;

    } catch (error) {
        console.error('Error fetching navigation:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicNav);
} else {
    loadDynamicNav();
}
