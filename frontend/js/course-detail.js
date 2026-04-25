// Get course ID from URL query string
function getCourseIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Render syllabus (accordion style)
function renderSyllabus(syllabus) {
    if (!syllabus || syllabus.length === 0) {
        return '<p>No syllabus available yet.</p>';
    }
    let html = '<div class="syllabus"><h3>Course Curriculum</h3>';
    syllabus.forEach((module, idx) => {
        html += `
            <div class="module">
                <div class="module-header" onclick="toggleModule(${idx})">
                    📘 ${module.module_title}
                </div>
                <div class="module-lessons" id="module-${idx}" style="display: block;">
                    <ul>
        `;
        module.lessons.forEach(lesson => {
            let typeIcon = lesson.content_type === 'video' ? '🎥' : (lesson.content_type === 'quiz' ? '📝' : '📄');
            html += `<li>${typeIcon} ${lesson.title} <span style="color:#6b7280; font-size:0.8rem;">${lesson.duration || ''}</span></li>`;
        });
        html += `</ul></div></div>`;
    });
    html += '</div>';
    return html;
}

// Toggle module visibility (global for accordion)
window.toggleModule = function(idx) {
    const el = document.getElementById(`module-${idx}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
};

// Show enrollment status and button
function renderEnrollSection(course, isAlreadyEnrolled, user) {
    const container = document.getElementById('enrollSection');
    if (!container) return;

    if (!user) {
        container.innerHTML = `
            <div class="alert alert-info">🔐 Please <a href="login.html?returnUrl=course-detail.html?id=${course.id}">login</a> to enroll.</div>
        `;
        return;
    }

    if (isAlreadyEnrolled) {
        container.innerHTML = `
            <div class="alert alert-success">✅ You are already enrolled in this course! <a href="learn.html?course_id=${course.id}">Go to learning →</a></div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="price-large">$${course.price}</div>
        <p style="margin: 1rem 0;">One-time payment gives you 3 months access + final exam (3 free attempts).</p>
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
        document.getElementById('courseDetailContainer').innerHTML = '<p>Invalid course.</p>';
        return;
    }

    const container = document.getElementById('courseDetailContainer');
    container.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const course = await MOCK_API.getCourseDetail(courseId);
        const user = MOCK_API.currentUser;
        const isEnrolled = user ? MOCK_API.isEnrolled(user.id, course.id) : false;

        const syllabusHtml = renderSyllabus(course.syllabus);

        container.innerHTML = `
            <div style="background: white; border-radius: 1rem; padding: 2rem;">
                <h1>${course.title}</h1>
                <p style="color: #4b5563; margin: 1rem 0;">${course.description}</p>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <span>📚 ${course.modules} modules</span>
                    <span>📖 ${course.lessons} lessons</span>
                </div>
                ${syllabusHtml}
                <div id="enrollSection" class="enroll-section"></div>
            </div>
        `;

        renderEnrollSection(course, isEnrolled, user);
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.error || 'Could not load course'}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourseDetail();
});