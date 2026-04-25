// common.js - Global navigation and auth utilities

// Check if user is logged in
function isLoggedIn() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    return !!(user && token);
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Logout function
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    if (typeof MOCK_API !== 'undefined') {
        MOCK_API.currentUser = null;
        localStorage.removeItem('mock_user');
    }
    window.location.href = 'login.html?success=logout';
}

// Update navigation based on auth state
function updateNavAuth() {
    const authLink = document.getElementById('authLink');
    if (!authLink) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        const userName = user.name || user.email || 'User';
        
        // Build navigation links
        let navHtml = `
            <a href="dashboard.html">Dashboard</a>
            <a href="profile.html">👤 My Profile</a>
        `;
        
        if (user.role === 'admin') {
            navHtml += `<a href="admin.html">⚙️ Admin Panel</a>`;
        }
        
        navHtml += `<a href="#" id="logoutBtn">🚪 Logout (${userName})</a>`;
        
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.innerHTML = navHtml;
            
            // Add logout handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
        }
    } else {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.innerHTML = `
                <a href="dashboard.html">Dashboard</a>
                <a href="login.html">🔐 Login / Register</a>
            `;
        }
    }
}

// Protect page - redirect to login if not authenticated
function protectPage(requireAdmin = false) {
    if (!isLoggedIn()) {
        window.location.href = `login.html?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        return false;
    }
    
    if (requireAdmin) {
        const user = getCurrentUser();
        if (user.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return false;
        }
    }
    
    return true;
}

// Show loading spinner
function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container" style="text-align: center; padding: 3rem;">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

// Hide loading (clear container)
function clearLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

// Show error message
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-error" style="background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem;">
                ❌ ${message}
            </div>
        `;
    }
}

// Show success message
function showSuccess(containerId, message, autoHide = true) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success" style="background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 0.5rem;">
                ✅ ${message}
            </div>
        `;
        
        if (autoHide) {
            setTimeout(() => {
                container.innerHTML = '';
            }, 3000);
        }
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Calculate days remaining until deadline
function getDaysRemaining(deadlineDate) {
    const deadline = new Date(deadlineDate);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Format days remaining as human readable
function formatDaysRemaining(days) {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Last day!';
    if (days === 1) return '1 day left';
    return `${days} days left`;
}

// Run on every page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
});

// Add loading spinner CSS if not present
if (!document.querySelector('#loading-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-container {
            text-align: center;
            padding: 2rem;
        }
        .alert {
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        }
        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .alert-info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
        }
    `;
    document.head.appendChild(style);
}