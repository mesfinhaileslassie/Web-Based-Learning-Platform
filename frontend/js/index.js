// Load and display courses

async function loadCourses() {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading">Loading...</div>';
    const courses = await MOCK_API.getCourses();

    if (courses.length === 0) {
        grid.innerHTML = '<p>No courses available.</p>';
        return;
    }

    grid.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-card-content">
                <h3>${course.title}</h3>
                <p>${course.description.substring(0, 100)}...</p>
                <div class="course-meta">
                    <span>📚 ${course.modules} modules</span>
                    <span class="price">$${course.price}</span>
                </div>
                <a href="course-detail.html?id=${course.id}" class="btn">View Course</a>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
});