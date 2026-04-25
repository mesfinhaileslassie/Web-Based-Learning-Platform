// learn.js - Learning interface

let currentCourse = null;
let currentLesson = null;
let currentLessonIndex = 0;
let allLessonsList = [];
let enrollment = null;
let completedLessonIds = [];

// Get course ID from URL
function getCourseIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('course_id');
}

// Load enrollment for current user and course
async function loadEnrollment(courseId) {
    const user = MOCK_API.currentUser;
    if (!user) return null;
    
    // Refresh enrollments from storage
    const enrollments = MOCK_API.getEnrollments();
    console.log('All enrollments:', enrollments);
    console.log('Looking for user:', user.id, 'course:', courseId);
    
    const enrollmentData = enrollments.find(e => e.userId == user.id && e.courseId == courseId);
    console.log('Found enrollment:', enrollmentData);
    
    return enrollmentData;
}

// Load course structure and lesson list
async function loadCourseData(courseId) {
    try {
        const course = await MOCK_API.getCourseDetail(courseId);
        currentCourse = course;
        allLessonsList = MOCK_API.getCourseLessonList(courseId);
        return course;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// Render sidebar curriculum
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!currentCourse) {
        sidebar.innerHTML = '<p>Unable to load curriculum.</p>';
        return;
    }

    let html = `<h3 style="margin-bottom:1rem;">📚 ${currentCourse.title}</h3>`;
    let globalLessonCounter = 0;
    
    currentCourse.syllabus.forEach(module => {
        html += `<div class="module-title">📘 ${module.module_title}</div>`;
        module.lessons.forEach(lesson => {
            const isCompleted = completedLessonIds.includes(lesson.lesson_id);
            const activeClass = (currentLesson && currentLesson.lesson_id === lesson.lesson_id) ? 'active' : '';
            const completedClass = isCompleted ? 'completed' : '';
            html += `
                <div class="curriculum-item ${activeClass} ${completedClass}" data-lesson-index="${globalLessonCounter}">
                    ${lesson.content_type === 'video' ? '🎥' : (lesson.content_type === 'quiz' ? '📝' : '📄')} 
                    ${lesson.title}
                    ${isCompleted ? '<span class="completion-badge">✓</span>' : ''}
                </div>
            `;
            globalLessonCounter++;
        });
    });
    
    sidebar.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.curriculum-item').forEach(elem => {
        elem.addEventListener('click', (e) => {
            const idx = parseInt(elem.dataset.lessonIndex);
            if (!isNaN(idx)) loadLessonByIndex(idx);
        });
    });
}

// Load lesson by index
async function loadLessonByIndex(index) {
    if (index < 0 || index >= allLessonsList.length) return;
    
    currentLessonIndex = index;
    const lessonInfo = allLessonsList[index];
    
    try {
        const lesson = await MOCK_API.getLessonContent(currentCourse.id, lessonInfo.lesson_id);
        currentLesson = lesson;
        renderLessonContent(lesson);
        renderSidebar();
        updateNavButtons();
    } catch (err) {
        document.getElementById('mainContent').innerHTML = `<div class="alert alert-error">Error loading lesson: ${err}</div>`;
    }
}

// Render lesson content
function renderLessonContent(lesson) {
    const mainEl = document.getElementById('mainContent');
    let contentHtml = `<h1 class="lesson-title">${lesson.title}</h1>`;
    contentHtml += `<div class="lesson-content">`;

    if (lesson.content_type === 'video' && lesson.content && lesson.content.videoUrl) {
        contentHtml += `
            <div class="video-container">
                <iframe src="${lesson.content.videoUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
            <p>${lesson.content.transcript || ''}</p>
        `;
    } else if (lesson.content_type === 'text' && lesson.content && lesson.content.text) {
        contentHtml += `<div>${lesson.content.text}</div>`;
    } else if (lesson.content_type === 'quiz' && lesson.practiceQuestions) {
        contentHtml += renderPracticeQuestions(lesson.practiceQuestions);
    } else {
        contentHtml += `<p>Content not available.</p>`;
    }

    const isAlreadyCompleted = completedLessonIds.includes(lesson.lesson_id);
    if (!isAlreadyCompleted) {
        contentHtml += `<button id="markCompleteBtn" class="btn mark-complete-btn">✓ Mark as Complete</button>`;
    } else {
        contentHtml += `<div class="alert alert-success">✅ You have completed this lesson.</div>`;
    }

    contentHtml += `</div>`;
    mainEl.innerHTML = contentHtml;

    const completeBtn = document.getElementById('markCompleteBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => markLessonComplete(lesson.lesson_id));
    }

    if (lesson.content_type === 'quiz' && lesson.practiceQuestions) {
        attachPracticeQuestionHandlers(lesson.practiceQuestions);
    }
}

// Render practice questions
function renderPracticeQuestions(questions) {
    let html = `<h3>📝 Practice Questions</h3><p>Test your understanding. Instant feedback provided.</p>`;
    questions.forEach((q, idx) => {
        html += `<div class="practice-question" data-qidx="${idx}">
                    <div class="question-text">${idx+1}. ${q.text}</div>`;
        if (q.type === 'true_false') {
            html += `<div class="option"><label><input type="radio" name="q${idx}" value="True"> True</label></div>
                     <div class="option"><label><input type="radio" name="q${idx}" value="False"> False</label></div>`;
        } else if (q.type === 'single_choice') {
            q.options.forEach(opt => {
                html += `<div class="option"><label><input type="radio" name="q${idx}" value="${opt}"> ${opt}</label></div>`;
            });
        } else if (q.type === 'multiple_choice') {
            q.options.forEach(opt => {
                html += `<div class="option"><label><input type="checkbox" name="q${idx}" value="${opt}"> ${opt}</label></div>`;
            });
        } else if (q.type === 'combobox') {
            html += `<select name="q${idx}" class="combobox" style="width:100%; padding:0.5rem;">
                        <option value="">Select...</option>`;
            q.options.forEach(opt => {
                html += `<option value="${opt}">${opt}</option>`;
            });
            html += `</select>`;
        }
        html += `<div class="feedback" id="feedback-${idx}"></div>
                </div>`;
    });
    html += `<button id="checkAnswersBtn" class="btn">Check Answers</button>`;
    return html;
}

function attachPracticeQuestionHandlers(questions) {
    const checkBtn = document.getElementById('checkAnswersBtn');
    if (!checkBtn) return;
    
    checkBtn.addEventListener('click', () => {
        let allCorrect = true;
        questions.forEach((q, idx) => {
            let userAnswer = null;
            if (q.type === 'multiple_choice') {
                const checkboxes = document.querySelectorAll(`input[name="q${idx}"]:checked`);
                userAnswer = Array.from(checkboxes).map(cb => cb.value).sort();
                const correctSorted = [...q.correct].sort();
                const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctSorted);
                if (!isCorrect) allCorrect = false;
                showFeedback(idx, isCorrect, q.correct);
            } else if (q.type === 'combobox') {
                const select = document.querySelector(`select[name="q${idx}"]`);
                userAnswer = select.value;
                const isCorrect = (userAnswer === q.correct);
                if (!isCorrect) allCorrect = false;
                showFeedback(idx, isCorrect, q.correct);
            } else {
                const selected = document.querySelector(`input[name="q${idx}"]:checked`);
                userAnswer = selected ? selected.value : null;
                const isCorrect = (userAnswer === q.correct);
                if (!isCorrect) allCorrect = false;
                showFeedback(idx, isCorrect, q.correct);
            }
        });
        if (allCorrect) {
            alert('🎉 All answers correct! You can now mark this lesson as complete.');
        } else {
            alert('Some answers are incorrect. Review and try again.');
        }
    });
}

function showFeedback(questionIdx, isCorrect, correctAnswer) {
    const feedbackDiv = document.getElementById(`feedback-${questionIdx}`);
    if (isCorrect) {
        feedbackDiv.innerHTML = `<span class="feedback correct">✓ Correct!</span>`;
    } else {
        let correctDisplay = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;
        feedbackDiv.innerHTML = `<span class="feedback incorrect">✗ Incorrect. Correct answer: ${correctDisplay}</span>`;
    }
}

async function markLessonComplete(lessonId) {
    if (!enrollment) {
        alert("Enrollment not found. Please refresh or contact support.");
        return;
    }
    await MOCK_API.markLessonComplete(enrollment.id, lessonId);
    completedLessonIds = await MOCK_API.getCompletedLessons(enrollment.id);
    renderSidebar();
    renderLessonContent(currentLesson);
}

function updateNavButtons() {
    const mainEl = document.getElementById('mainContent');
    let navHtml = `<div class="nav-buttons">`;
    if (currentLessonIndex > 0) {
        navHtml += `<button id="prevLessonBtn" class="btn">← Previous Lesson</button>`;
    } else {
        navHtml += `<div></div>`;
    }
    if (currentLessonIndex < allLessonsList.length - 1) {
        navHtml += `<button id="nextLessonBtn" class="btn">Next Lesson →</button>`;
    } else {
        navHtml += `<div></div>`;
    }
    navHtml += `</div>`;
    
    if (!document.querySelector('.nav-buttons')) {
        mainEl.insertAdjacentHTML('beforeend', navHtml);
    } else {
        document.querySelector('.nav-buttons').outerHTML = navHtml;
    }
    
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => loadLessonByIndex(currentLessonIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => loadLessonByIndex(currentLessonIndex + 1));
}

// Initialize page
async function initLearn() {
    const courseId = getCourseIdFromURL();
    if (!courseId) {
        document.getElementById('mainContent').innerHTML = '<div class="alert alert-error">No course specified.</div>';
        return;
    }

    const user = MOCK_API.currentUser;
    if (!user) {
        document.getElementById('mainContent').innerHTML = `
            <div class="alert alert-info">
                Please login to access this course. 
                <a href="login.html?returnUrl=learn.html?course_id=${courseId}">Login now</a>
            </div>
        `;
        return;
    }

    enrollment = await loadEnrollment(courseId);
    console.log('Enrollment object:', enrollment);
    
    if (!enrollment) {
        document.getElementById('mainContent').innerHTML = `
            <div class="alert alert-info">
                You are not enrolled in this course. 
                <a href="course-detail.html?id=${courseId}">Enroll now</a> to start learning.
            </div>
        `;
        document.getElementById('sidebar').innerHTML = '<div class="alert alert-info">Enroll to see curriculum</div>';
        return;
    }

    // Check if enrollment is expired
    const deadline = new Date(enrollment.deadline);
    if (deadline < new Date() && enrollment.status !== 'completed') {
        document.getElementById('mainContent').innerHTML = `
            <div class="alert alert-error">
                ⏰ Your enrollment has expired. Please re-enroll to continue.
                <a href="course-detail.html?id=${courseId}">Re-enroll now</a>
            </div>
        `;
        return;
    }

    completedLessonIds = await MOCK_API.getCompletedLessons(enrollment.id);
    const course = await loadCourseData(courseId);
    
    if (!course) {
        document.getElementById('mainContent').innerHTML = '<div class="alert alert-error">Course not found.</div>';
        return;
    }

    renderSidebar();

    let startIndex = 0;
    for (let i = 0; i < allLessonsList.length; i++) {
        if (!completedLessonIds.includes(allLessonsList[i].lesson_id)) {
            startIndex = i;
            break;
        }
    }
    await loadLessonByIndex(startIndex);
}

document.addEventListener('DOMContentLoaded', () => {
    initLearn();
});