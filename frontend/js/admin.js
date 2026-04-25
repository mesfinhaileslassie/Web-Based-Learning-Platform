// admin.js
let currentSection = 'courses';

// Check admin access
function checkAdmin() {
    if (!MOCK_API.currentUser || MOCK_API.currentUser.role !== 'admin') {
        document.getElementById('adminContent').innerHTML = `
            <div class="alert alert-error">Access denied. Admin only.</div>
            <p>Please login as admin: admin@example.com / admin123</p>
            <button id="adminLoginBtn" class="btn">Login as Admin</button>
        `;
        const btn = document.getElementById('adminLoginBtn');
        if (btn) {
            btn.addEventListener('click', async () => {
                await MOCK_API.login('admin@example.com', 'admin123');
                window.location.reload();
            });
        }
        return false;
    }
    return true;
}

// Sidebar navigation
function initSidebar() {
    document.querySelectorAll('.admin-sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentSection = link.dataset.section;
            loadSection(currentSection);
            // active style
            document.querySelectorAll('.admin-sidebar a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Load section content
async function loadSection(section) {
    const container = document.getElementById('adminContent');
    if (section === 'courses') {
        await renderCoursesManagement();
    } else if (section === 'questions') {
        await renderQuestionsManagement();
    } else if (section === 'analytics') {
        await renderAnalytics();
    }
}

// -------------------- Courses Management --------------------
async function renderCoursesManagement() {
    const courses = await MOCK_API.getAllCourses();
    let html = `
        <div style="display: flex; justify-content: space-between;">
            <h2>Manage Courses</h2>
            <button id="addCourseBtn" class="btn">+ Add Course</button>
        </div>
        <table class="data-table">
            <thead><tr><th>ID</th><th>Title</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody>
    `;
    courses.forEach(c => {
        html += `<tr>
            <td>${c.id}</td>
            <td>${c.title}</td>
            <td>$${c.price}</td>
            <td>
                <button class="btn-icon edit-course" data-id="${c.id}">✏️</button>
                <button class="btn-icon delete-course" data-id="${c.id}">🗑️</button>
            </td>
        </tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('adminContent').innerHTML = html;

    document.getElementById('addCourseBtn').addEventListener('click', () => showCourseModal());
    document.querySelectorAll('.edit-course').forEach(btn => {
        btn.addEventListener('click', () => showCourseModal(btn.dataset.id));
    });
    document.querySelectorAll('.delete-course').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Delete this course?')) {
                await MOCK_API.deleteCourse(btn.dataset.id);
                await renderCoursesManagement();
            }
        });
    });
}

function showCourseModal(courseId = null) {
    const modal = document.getElementById('modal');
    const content = modal.querySelector('.modal-content');
    if (courseId) {
        // Load course data and pre-fill
        MOCK_API.getAllCourses().then(courses => {
            const course = courses.find(c => c.id == courseId);
            content.innerHTML = `
                <h3>Edit Course</h3>
                <div class="form-group"><label>Title</label><input id="editTitle" value="${course.title}"></div>
                <div class="form-group"><label>Description</label><textarea id="editDesc">${course.description}</textarea></div>
                <div class="form-group"><label>Price</label><input id="editPrice" type="number" value="${course.price}"></div>
                <button id="saveCourseBtn" class="btn">Save</button>
                <button id="closeModal" class="btn btn-outline">Cancel</button>
            `;
            document.getElementById('saveCourseBtn').onclick = async () => {
                await MOCK_API.updateCourse(courseId, {
                    title: document.getElementById('editTitle').value,
                    description: document.getElementById('editDesc').value,
                    price: parseFloat(document.getElementById('editPrice').value)
                });
                modal.style.display = 'none';
                await renderCoursesManagement();
            };
            modal.style.display = 'flex';
        });
    } else {
        content.innerHTML = `
            <h3>Add New Course</h3>
            <div class="form-group"><label>Title</label><input id="newTitle"></div>
            <div class="form-group"><label>Description</label><textarea id="newDesc"></textarea></div>
            <div class="form-group"><label>Price</label><input id="newPrice" type="number"></div>
            <button id="createCourseBtn" class="btn">Create</button>
            <button id="closeModal" class="btn btn-outline">Cancel</button>
        `;
        document.getElementById('createCourseBtn').onclick = async () => {
            await MOCK_API.addCourse({
                title: document.getElementById('newTitle').value,
                description: document.getElementById('newDesc').value,
                price: document.getElementById('newPrice').value
            });
            modal.style.display = 'none';
            await renderCoursesManagement();
        };
        modal.style.display = 'flex';
    }
    document.getElementById('closeModal')?.addEventListener('click', () => modal.style.display = 'none');
}

// -------------------- Questions Management --------------------
async function renderQuestionsManagement() {
    const courses = await MOCK_API.getAllCourses();
    let html = `<h2>Manage Questions</h2>
        <div class="form-group"><label>Select Course</label><select id="qCourseSelect">`;
    courses.forEach(c => {
        html += `<option value="${c.id}">${c.title}</option>`;
    });
    html += `</select></div>
        <div class="tabs" id="questionTabs">
            <button class="tab active" data-qtype="practice">Practice Questions (by lesson)</button>
            <button class="tab" data-qtype="final">Final Exam Questions</button>
        </div>
        <div id="questionsPane">Select a course and question type.</div>`;
    document.getElementById('adminContent').innerHTML = html;

    let currentType = 'practice';
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentType = tab.dataset.qtype;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadQuestionsForCourse(document.getElementById('qCourseSelect').value, currentType);
        });
    });
    document.getElementById('qCourseSelect').addEventListener('change', () => {
        loadQuestionsForCourse(document.getElementById('qCourseSelect').value, currentType);
    });
    await loadQuestionsForCourse(courses[0].id, currentType);
}

async function loadQuestionsForCourse(courseId, type) {
    const container = document.getElementById('questionsPane');
    if (type === 'practice') {
        // Need list of lessons for this course
        const course = await MOCK_API.getCourseDetail(courseId);
        let html = `<h3>Practice Questions per Lesson</h3><select id="lessonSelect">`;
        const lessons = MOCK_API.getCourseLessonList(courseId);
        lessons.forEach(lesson => {
            html += `<option value="${lesson.lesson_id}">${lesson.title}</option>`;
        });
        html += `</select>
            <button id="loadPracticeBtn" class="btn">Load Questions</button>
            <div id="practiceQsEditor"></div>`;
        container.innerHTML = html;
        document.getElementById('loadPracticeBtn').addEventListener('click', async () => {
            const lessonId = document.getElementById('lessonSelect').value;
            const questions = await MOCK_API.getPracticeQuestionsForLessonAdmin(lessonId);
            renderPracticeEditor(lessonId, questions);
        });
    } else {
        const questions = await MOCK_API.getFinalExamQuestionsAdmin(courseId);
        renderFinalExamEditor(courseId, questions);
    }
}

function renderPracticeEditor(lessonId, questions) {
    const editorDiv = document.getElementById('practiceQsEditor');
    let html = `<h4>Edit Practice Questions (Lesson ${lessonId})</h4>
        <div id="questionsList">`;
    questions.forEach((q, idx) => {
        html += `<div class="question-item">
            <input type="text" value="${q.text}" placeholder="Question text" class="q-text" data-idx="${idx}">
            <select class="q-type" data-idx="${idx}">
                <option ${q.type==='true_false'?'selected':''}>true_false</option>
                <option ${q.type==='single_choice'?'selected':''}>single_choice</option>
                <option ${q.type==='multiple_choice'?'selected':''}>multiple_choice</option>
                <option ${q.type==='combobox'?'selected':''}>combobox</option>
            </select>
            <input type="text" value="${q.options.join(',')}" placeholder="Options (comma separated)" class="q-options" data-idx="${idx}">
            <input type="text" value="${q.correct}" placeholder="Correct answer(s)" class="q-correct" data-idx="${idx}">
            <button class="btn-icon remove-q" data-idx="${idx}">❌</button>
        </div>`;
    });
    html += `</div><button id="addPracticeQ" class="btn">+ Add Question</button>
        <button id="savePracticeQs" class="btn btn-success">Save All</button>`;
    editorDiv.innerHTML = html;

    // Add question
    document.getElementById('addPracticeQ').onclick = () => {
        questions.push({ type: "true_false", text: "New question", options: ["True","False"], correct: "True" });
        renderPracticeEditor(lessonId, questions);
    };
    // Save
    document.getElementById('savePracticeQs').onclick = async () => {
        const updated = [];
        document.querySelectorAll('.question-item').forEach((item, idx) => {
            updated.push({
                text: item.querySelector('.q-text').value,
                type: item.querySelector('.q-type').value,
                options: item.querySelector('.q-options').value.split(',').map(s => s.trim()),
                correct: item.querySelector('.q-correct').value
            });
        });
        await MOCK_API.updatePracticeQuestions(lessonId, updated);
        alert('Practice questions saved.');
    };
    // Remove
    document.querySelectorAll('.remove-q').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            questions.splice(idx, 1);
            renderPracticeEditor(lessonId, questions);
        };
    });
}

function renderFinalExamEditor(courseId, questions) {
    const container = document.getElementById('questionsPane');
    let html = `<h3>Final Exam Questions for Course ID ${courseId}</h3>
        <div id="finalQuestionsList">`;
    questions.forEach((q, idx) => {
        html += `<div class="question-item">
            <input type="text" value="${q.text}" class="q-text" data-idx="${idx}">
            <select class="q-type" data-idx="${idx}">
                <option ${q.type==='true_false'?'selected':''}>true_false</option>
                <option ${q.type==='single_choice'?'selected':''}>single_choice</option>
                <option ${q.type==='multiple_choice'?'selected':''}>multiple_choice</option>
                <option ${q.type==='combobox'?'selected':''}>combobox</option>
            </select>
            <input type="text" value="${q.options.join(',')}" class="q-options" data-idx="${idx}">
            <input type="text" value="${q.correct}" class="q-correct" data-idx="${idx}">
            <button class="btn-icon remove-final-q" data-idx="${idx}">❌</button>
        </div>`;
    });
    html += `</div><button id="addFinalQ" class="btn">+ Add Question</button>
        <button id="saveFinalQs" class="btn">Save Final Exam</button>`;
    container.innerHTML = html;

    document.getElementById('addFinalQ').onclick = () => {
        questions.push({ id: Date.now(), text: "New question", type: "true_false", options: ["True","False"], correct: "True" });
        renderFinalExamEditor(courseId, questions);
    };
    document.getElementById('saveFinalQs').onclick = async () => {
        const updated = [];
        document.querySelectorAll('.question-item').forEach((item, idx) => {
            updated.push({
                id: questions[idx]?.id || Date.now() + idx,
                text: item.querySelector('.q-text').value,
                type: item.querySelector('.q-type').value,
                options: item.querySelector('.q-options').value.split(',').map(s => s.trim()),
                correct: item.querySelector('.q-correct').value
            });
        });
        await MOCK_API.updateFinalExamQuestions(courseId, updated);
        alert('Final exam questions saved.');
    };
    document.querySelectorAll('.remove-final-q').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            questions.splice(idx, 1);
            renderFinalExamEditor(courseId, questions);
        };
    });
}

// -------------------- Analytics --------------------
async function renderAnalytics() {
    const analytics = await MOCK_API.getAnalytics();
    let html = `<h2>Platform Analytics</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem;">
            <div style="background:white;padding:1rem;border-radius:0.5rem;"><strong>Total Enrollments</strong><br>${analytics.totalEnrollments}</div>
            <div><strong>Completions</strong><br>${analytics.completedEnrollments}</div>
            <div><strong>Pass Rate</strong><br>${analytics.passRate}%</div>
            <div><strong>Total Revenue</strong><br>$${analytics.totalRevenue.toFixed(2)}</div>
        </div>
        <h3>Per-Course Stats</h3>
        <table class="data-table">
            <thead><tr><th>Course</th><th>Enrollments</th><th>Completions</th><th>Revenue</th></tr></thead>
            <tbody>`;
    analytics.courseStats.forEach(stat => {
        html += `<tr><td>${stat.title}</td><td>${stat.enrollments}</td><td>${stat.completions}</td><td>$${stat.revenue.toFixed(2)}</td></tr>`;
    });
    html += `</tbody></table>`;
    document.getElementById('adminContent').innerHTML = html;
}

// -------------------- Initialization --------------------
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdmin()) return;
    initSidebar();
    // Load default section
    await loadSection('courses');
});