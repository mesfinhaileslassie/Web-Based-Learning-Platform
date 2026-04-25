// exam.js

let currentEnrollment = null;
let currentCourse = null;
let selectedQuestions = [];   // array of question objects (randomised)
let userAnswers = [];         // store user selections
let remainingAttempts = 0;

// Helper: get URL params
function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Anti-copy measures
function enableAntiCopy() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('cut', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
            e.preventDefault();
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
        }
    });
    // Watermark with user info
    const user = MOCK_API.currentUser;
    if (user && document.getElementById('watermark')) {
        document.getElementById('watermark').innerText = `${user.email} - ${new Date().toLocaleString()}`;
    }
}

// Randomize array (Fisher-Yates)
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Load exam data
async function loadExam() {
    const enrollmentId = getParam('enrollment_id');
    const courseId = getParam('course_id');
    if (!enrollmentId || !courseId) {
        document.getElementById('examContainer').innerHTML = '<div class="warning">Invalid exam link. Missing parameters.</div>';
        return;
    }

    const user = MOCK_API.currentUser;
    if (!user) {
        document.getElementById('examContainer').innerHTML = '<div class="warning">Please login to take the exam. <a href="#" id="loginNow">Login</a></div>';
        document.getElementById('loginNow')?.addEventListener('click', (e) => {
            e.preventDefault();
            MOCK_API.login('student@example.com', 'pass').then(() => window.location.reload());
        });
        return;
    }

    // Get enrollment from stored enrollments
    const allEnrollments = MOCK_API.getEnrollments();
    currentEnrollment = allEnrollments.find(e => e.id == enrollmentId && e.userId === user.id);
    if (!currentEnrollment) {
        document.getElementById('examContainer').innerHTML = '<div class="warning">Enrollment not found.</div>';
        return;
    }

    // Check deadline
    const deadline = new Date(currentEnrollment.deadline);
    if (deadline < new Date()) {
        document.getElementById('examContainer').innerHTML = '<div class="warning">Your enrollment period has expired. You cannot take the exam.</div>';
        return;
    }

    // Check status
    if (currentEnrollment.status === 'completed') {
        document.getElementById('examContainer').innerHTML = '<div class="warning">You have already passed this course. Certificate issued.</div>';
        return;
    }
    if (currentEnrollment.status === 'failed') {
        document.getElementById('examContainer').innerHTML = '<div class="warning">You have exhausted all exam attempts. Please purchase more attempts or re-enroll.</div>';
        return;
    }

    remainingAttempts = MOCK_API.getRemainingExamAttempts(currentEnrollment.id);
    if (remainingAttempts <= 0) {
        document.getElementById('examContainer').innerHTML = '<div class="warning">No exam attempts remaining. <a href="#">Buy more attempts</a> (payment mock).</div>';
        return;
    }

    // Load course details and question bank
    try {
        currentCourse = await MOCK_API.getCourseDetail(courseId);
        const fullBank = MOCK_API.getFinalExamQuestions(courseId);
        // Select 5 random questions for demo (change to 10 in production)
        const numberOfQuestions = Math.min(5, fullBank.length);
        const shuffledBank = shuffleArray([...fullBank]);
        selectedQuestions = shuffledBank.slice(0, numberOfQuestions);
        // Randomize answer options for each question
        selectedQuestions.forEach(q => {
            if (q.type !== 'multiple_choice' && q.type !== 'single_choice' && q.type !== 'combobox') return;
            q.options = shuffleArray([...q.options]);
        });
        userAnswers = new Array(selectedQuestions.length).fill(null);
        renderExam();
    } catch (err) {
        document.getElementById('examContainer').innerHTML = `<div class="warning">Error loading exam: ${err}</div>`;
    }
}

// Render exam questions
function renderExam() {
    const container = document.getElementById('examContainer');
    let html = `
        <div class="exam-header">
            <h2>Final Exam: ${currentCourse.title}</h2>
            <div class="timer" id="timer"></div>
            <div class="warning">⚠️ This exam is proctored. Copying, screenshots, or leaving the page may invalidate your attempt.</div>
            <p>Attempts remaining: ${remainingAttempts}<br>Passing score: 60%</p>
        </div>
        <form id="examForm">
    `;

    selectedQuestions.forEach((q, idx) => {
        html += `<div class="exam-question" data-qidx="${idx}">
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
        html += `</div>`;
    });

    html += `<div class="exam-actions">
                <button type="button" id="submitExamBtn" class="btn">Submit Exam</button>
                <button type="button" id="cancelExamBtn" class="btn btn-outline">Cancel</button>
            </div>
        </form>`;
    container.innerHTML = html;

    // Attach event handlers
    document.getElementById('submitExamBtn').addEventListener('click', submitExam);
    document.getElementById('cancelExamBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Your progress will not be saved.')) {
            window.location.href = 'dashboard.html';
        }
    });

    // Store user answers on change
    for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        const inputs = document.querySelectorAll(`input[name="q${i}"], select[name="q${i}"]`);
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (q.type === 'multiple_choice') {
                    const checked = Array.from(document.querySelectorAll(`input[name="q${i}"]:checked`)).map(cb => cb.value);
                    userAnswers[i] = checked;
                } else if (q.type === 'combobox') {
                    userAnswers[i] = document.querySelector(`select[name="q${i}"]`).value;
                } else {
                    const selected = document.querySelector(`input[name="q${i}"]:checked`);
                    userAnswers[i] = selected ? selected.value : null;
                }
            });
        });
    }

    // Optional: timer (60 minutes)
    startTimer(60 * 60);
}

// Timer function (seconds)
let timerInterval;
function startTimer(seconds) {
    let remaining = seconds;
    const timerEl = document.getElementById('timer');
    function updateDisplay() {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerEl.innerText = `Time remaining: ${mins}:${secs.toString().padStart(2,'0')}`;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting exam automatically.');
            submitExam();
        }
        remaining--;
    }
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);
}

// Grade the exam
function submitExam() {
    clearInterval(timerInterval);
    // Check all questions answered
    let allAnswered = true;
    for (let i = 0; i < selectedQuestions.length; i++) {
        const answer = userAnswers[i];
        if (answer === null || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && answer === '')) {
            allAnswered = false;
            break;
        }
    }
    if (!allAnswered) {
        if (!confirm("You haven't answered all questions. Submit anyway?")) {
            // Restart timer? Simpler: reload exam
            window.location.reload();
            return;
        }
    }

    // Calculate score
    let correctCount = 0;
    for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        const userAns = userAnswers[i];
        let isCorrect = false;
        if (q.type === 'multiple_choice') {
            const correctSorted = [...q.correct].sort();
            const userSorted = [...userAns].sort();
            isCorrect = JSON.stringify(correctSorted) === JSON.stringify(userSorted);
        } else {
            isCorrect = (userAns === q.correct);
        }
        if (isCorrect) correctCount++;
    }
    const percentage = (correctCount / selectedQuestions.length) * 100;
    const passed = percentage >= 60;

    // Record attempt in mock-api
    MOCK_API.recordExamAttempt(currentEnrollment.id, passed).then(async (result) => {
        if (passed) {
            await MOCK_API.issueCertificate(currentEnrollment.id);
            alert(`🎉 Congratulations! You passed with ${percentage.toFixed(1)}%. Certificate has been issued.`);
        } else {
            const newRemaining = MOCK_API.getRemainingExamAttempts(currentEnrollment.id);
            if (newRemaining > 0) {
                alert(`❌ You scored ${percentage.toFixed(1)}%. You need 60% to pass. You have ${newRemaining} attempt(s) left.`);
            } else {
                alert(`❌ You scored ${percentage.toFixed(1)}%. You have no attempts remaining. Please purchase more attempts or re-enroll.`);
            }
        }
        window.location.href = 'dashboard.html';
    }).catch(err => {
        alert('Error recording exam attempt: ' + err);
        window.location.href = 'dashboard.html';
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    enableAntiCopy();
    loadExam();
});