// course-detail.js

// Get course ID from URL
function getCourseIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Toggle module visibility
window.toggleModule = function(moduleId) {
    const content = document.getElementById(`module-content-${moduleId}`);
    const icon = document.getElementById(`module-icon-${moduleId}`);
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        if (icon) {
            icon.textContent = isHidden ? '▼' : '▶';
        }
    }
};

// Render syllabus
function renderSyllabus(course) {
    if (!course.syllabus || course.syllabus.length === 0) {
        return '<p>No syllabus available yet. Coming soon!</p>';
    }
    
    let html = '<div class="syllabus"><h3>📚 Course Curriculum</h3>';
    
    course.syllabus.forEach((module, idx) => {
        html += `
            <div class="module">
                <div class="module-header" onclick="toggleModule(${idx})">
                    <span>📘 ${module.module_title}</span>
                    <span id="module-icon-${idx}">▼</span>
                </div>
                <div id="module-content-${idx}" class="module-lessons" style="display: block;">
                    <ul style="list-style: none; margin: 0; padding: 0;">
        `;
        
        module.lessons.forEach(lesson => {
            let typeIcon = '📄';
            if (lesson.content_type === 'video') typeIcon = '🎥';
            else if (lesson.content_type === 'quiz') typeIcon = '📝';
            
            html += `
                <li>
                    <span class="lesson-icon">${typeIcon}</span>
                    <span class="lesson-title">${lesson.title}</span>
                    <span class="lesson-duration">${lesson.duration || ''}</span>
                </li>
            `;
        });
        
        html += `</ul></div></div>`;
    });
    
    html += '</div>';
    return html;
}

// Render enrollment section
function renderEnrollSection(course, isAlreadyEnrolled, user) {
    const container = document.getElementById('enrollSection');
    if (!container) return;

    if (!user) {
        container.innerHTML = `
            <div class="alert alert-info">
                🔐 Please <a href="login.html?returnUrl=course-detail.html?id=${course.id}">login</a> to enroll in this course.
            </div>
        `;
        return;
    }

    if (isAlreadyEnrolled) {
        container.innerHTML = `
            <div class="alert alert-success">
                ✅ You are already enrolled in this course! 
                <a href="learn.html?course_id=${course.id}">Continue Learning →</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="price-large">$${course.price}</div>
        <p style="margin: 1rem 0;">
            One-time payment gives you <strong>3 months access</strong> + final exam (<strong>3 free attempts</strong>).<br>
            Pass the exam with 60% to earn your certificate.
        </p>
        <button id="enrollNowBtn" class="btn btn-large">Enroll Now</button>
        <div id="enrollMessage"></div>
    `;

    const enrollBtn = document.getElementById('enrollNowBtn');
    enrollBtn.addEventListener('click', () => {
        window.location.href = `enrollment.html?course_id=${course.id}`;
    });
}

// Main load function
async function loadCourseDetail() {
    const courseId = getCourseIdFromURL();
    if (!courseId) {
        document.getElementById('courseDetailContainer').innerHTML = '<div class="alert alert-error">Invalid course ID.</div>';
        return;
    }

    const container = document.getElementById('courseDetailContainer');
    
    try {
        const course = await MOCK_API.getCourseDetail(courseId);
        const user = MOCK_API.currentUser;
        const isEnrolled = user ? MOCK_API.isEnrolled(user.id, course.id) : false;
        const syllabusHtml = renderSyllabus(course);

        container.innerHTML = `
            <div class="course-header">
                <h1>${course.title}</h1>
                <p style="color: #4b5563; margin: 1rem 0;">${course.description}</p>
                <div class="course-meta">
                    <span>📚 ${course.modules} modules</span>
                    <span>📖 ${course.lessons} lessons</span>
                    <span>💰 $${course.price}</span>
                </div>
            </div>
            ${syllabusHtml}
            <div id="enrollSection" class="enroll-section"></div>
        `;

        renderEnrollSection(course, isEnrolled, user);
        
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">❌ Error: ${err.error || 'Could not load course'}</div>`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCourseDetail();
});