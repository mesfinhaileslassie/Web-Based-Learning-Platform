// common.js - Updated

function isLoggedIn() {
    return MOCK_API.currentUser !== null;
}

function updateNavAuth() {
    const authLink = document.getElementById('authLink');
    if (!authLink) return;

    if (isLoggedIn()) {
        const user = MOCK_API.currentUser;
        let adminLink = '';
        if (user.role === 'admin') {
            adminLink = `<a href="admin.html">Admin Panel</a>`;
        }
        authLink.innerHTML = `👤 ${user.name} (Logout)`;
        authLink.href = "#";
        authLink.onclick = (e) => {
            e.preventDefault();
            MOCK_API.logout().then(() => {
                window.location.href = "index.html";
            });
        };
        // Add admin link after authLink if not already present
        const navLinks = document.querySelector('.nav-links');
        if (adminLink && !document.querySelector('.nav-links a[href="admin.html"]')) {
            navLinks.insertAdjacentHTML('beforeend', adminLink);
        }
    } else {
        authLink.innerHTML = "Login / Register";
        authLink.href = "login.html";
        authLink.onclick = null;
        // Remove admin link if any
        const adminLinkElem = document.querySelector('.nav-links a[href="admin.html"]');
        if (adminLinkElem) adminLinkElem.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
});