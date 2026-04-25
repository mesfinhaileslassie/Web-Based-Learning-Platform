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
        let profileLink = '<a href="profile.html">👤 My Profile</a>';
        
        if (user.role === 'admin') {
            adminLink = `<a href="admin.html">⚙️ Admin Panel</a>`;
        }
        
        authLink.innerHTML = `🚪 Logout (${user.name})`;
        authLink.href = "#";
        authLink.onclick = (e) => {
            e.preventDefault();
            MOCK_API.logout().then(() => {
                window.location.href = "index.html";
            });
        };
        
        const navLinks = document.querySelector('.nav-links');
        // Remove existing dynamic links to avoid duplicates
        const existingProfile = document.querySelector('.nav-links a[href="profile.html"]');
        const existingAdmin = document.querySelector('.nav-links a[href="admin.html"]');
        if (existingProfile) existingProfile.remove();
        if (existingAdmin) existingAdmin.remove();
        
        // Insert profile link before authLink
        authLink.insertAdjacentHTML('beforebegin', profileLink);
        if (adminLink) {
            authLink.insertAdjacentHTML('beforebegin', adminLink);
        }
    } else {
        authLink.innerHTML = "🔐 Login / Register";
        authLink.href = "login.html";
        authLink.onclick = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
});