// mock-api.js
// Complete mock backend for the learning platform
// Uses localStorage to persist enrollments, lesson progress, and exam attempts

const MOCK_API = {
    // Current logged-in user
    currentUser: null,

    // Sample courses with detailed syllabus and practice questions
    courses: [
        {
            id: 1,
            title: "Python Programming Mastery",
            description: "From zero to building real-world applications. Learn variables, loops, functions, OOP, and more.",
            price: 49.99,
            modules: 5,
            lessons: 24,
            imagePlaceholder: "🐍",
            syllabus: [
                {
                    module_id: 1,
                    module_title: "Python Basics",
                    lessons: [
                        { lesson_id: 101, title: "Introduction & Setup", content_type: "video", duration: "10 min" },
                        { lesson_id: 102, title: "Variables and Data Types", content_type: "text", duration: "15 min" },
                        { lesson_id: 103, title: "Practice: Variables Quiz", content_type: "quiz", practice_questions: true, duration: "10 min" }
                    ]
                },
                {
                    module_id: 2,
                    module_title: "Control Flow",
                    lessons: [
                        { lesson_id: 201, title: "If-Else Statements", content_type: "video", duration: "12 min" },
                        { lesson_id: 202, title: "Loops (for/while)", content_type: "text", duration: "20 min" },
                        { lesson_id: 203, title: "Practice: Loops & Conditions", content_type: "quiz", practice_questions: true, duration: "15 min" }
                    ]
                }
            ]
        },
        {
            id: 2,
            title: "JavaScript & Web Development",
            description: "Master HTML, CSS, JavaScript, and modern frameworks like React (intro).",
            price: 59.99,
            modules: 6,
            lessons: 32,
            imagePlaceholder: "🌐",
            syllabus: [
                {
                    module_id: 1,
                    module_title: "JavaScript Fundamentals",
                    lessons: [
                        { lesson_id: 301, title: "Variables & Functions", content_type: "video", duration: "15 min" },
                        { lesson_id: 302, title: "DOM Manipulation", content_type: "text", duration: "18 min" },
                        { lesson_id: 303, title: "Practice: JS Basics", content_type: "quiz", practice_questions: true, duration: "12 min" }
                    ]
                }
            ]
        },
        {
            id: 3,
            title: "Data Science with R",
            description: "Statistics, data visualization, and machine learning basics using R.",
            price: 69.99,
            modules: 4,
            lessons: 20,
            imagePlaceholder: "📊",
            syllabus: [] // empty for now
        }
    ],

    // LocalStorage keys
    STORAGE_KEYS: {
        ENROLLMENTS: "mock_enrollments",
        USER: "mock_user",
        LESSON_PROGRESS: "mock_lesson_progress"
    },

    // ==================== Enrollment Helpers ====================
    getEnrollments: function() {
        const stored = localStorage.getItem(this.STORAGE_KEYS.ENROLLMENTS);
        return stored ? JSON.parse(stored) : [];
    },

    saveEnrollments: function(enrollments) {
        localStorage.setItem(this.STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
    },

    getLessonProgress: function(enrollmentId) {
        const all = localStorage.getItem(this.STORAGE_KEYS.LESSON_PROGRESS);
        const progress = all ? JSON.parse(all) : {};
        return progress[enrollmentId] || { completedLessonIds: [] };
    },

    saveLessonProgress: function(enrollmentId, completedLessonIds) {
        const all = localStorage.getItem(this.STORAGE_KEYS.LESSON_PROGRESS);
        const progress = all ? JSON.parse(all) : {};
        progress[enrollmentId] = { completedLessonIds: completedLessonIds };
        localStorage.setItem(this.STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(progress));
    },

    // ==================== Course & Lesson Data ====================
    getCourses: function() {
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.courses), 300);
        });
    },

    getCourseDetail: function(courseId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const course = this.courses.find(c => c.id == courseId);
                if (course) resolve(course);
                else reject({ error: "Course not found" });
            }, 200);
        });
    },

    // Get flat list of all lessons in a course (for linear navigation)
    getCourseLessonList: function(courseId) {
        const course = this.courses.find(c => c.id == courseId);
        if (!course) return [];
        const lessons = [];
        course.syllabus.forEach(module => {
            module.lessons.forEach(lesson => {
                lessons.push({
                    ...lesson,
                    module_title: module.module_title,
                    courseId: courseId
                });
            });
        });
        return lessons;
    },

    // Get content for a specific lesson (including practice questions if any)
    getLessonContent: function(courseId, lessonId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const course = this.courses.find(c => c.id == courseId);
                if (!course) return reject("Course not found");
                let foundLesson = null;
                for (let mod of course.syllabus) {
                    for (let les of mod.lessons) {
                        if (les.lesson_id == lessonId) {
                            foundLesson = { ...les, module_title: mod.module_title };
                            break;
                        }
                    }
                }
                if (!foundLesson) return reject("Lesson not found");

                // Mock content based on lesson type
                if (foundLesson.content_type === 'video') {
                    foundLesson.content = {
                        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=placeholder",
                        transcript: "This is a mock video lesson content. In a real platform, this would be your actual lecture video."
                    };
                } else if (foundLesson.content_type === 'text') {
                    foundLesson.content = {
                        text: `<p>This is a sample text lesson for <strong>${foundLesson.title}</strong>.</p>
                               <p>Here you would learn key concepts, see examples, and read explanations.</p>
                               <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`
                    };
                } else if (foundLesson.content_type === 'quiz' && foundLesson.practice_questions) {
                    foundLesson.practiceQuestions = this.getPracticeQuestionsForLesson(courseId, lessonId);
                }
                resolve(foundLesson);
            }, 200);
        });
    },

    // Generate practice questions (true/false, single choice, multiple choice, combobox)
    getPracticeQuestionsForLesson: function(courseId, lessonId) {
        const questionBank = {
            103: [  // Python Variables Quiz
                { type: "true_false", text: "Python uses indentation to define code blocks.", options: ["True", "False"], correct: "True" },
                { type: "single_choice", text: "Which of these is a valid variable name?", options: ["2var", "_var", "var-name", "var name"], correct: "_var" },
                { type: "multiple_choice", text: "Which of the following are Python data types? (Select all that apply)", options: ["int", "float", "char", "string"], correct: ["int", "float", "string"] },
                { type: "combobox", text: "What keyword is used to define a function in Python?", options: ["def", "func", "define", "function"], correct: "def" }
            ],
            203: [  // Loops & Conditions Quiz
                { type: "true_false", text: "A 'for' loop can iterate over a list.", options: ["True", "False"], correct: "True" },
                { type: "single_choice", text: "Which loop is guaranteed to execute at least once?", options: ["for", "while", "do-while (Python doesn't have it)", "foreach"], correct: "do-while (Python doesn't have it)" },
                { type: "combobox", text: "What does 'range(5)' produce?", options: ["0,1,2,3,4", "1,2,3,4,5", "0,1,2,3,4,5", "1,2,3,4"], correct: "0,1,2,3,4" }
            ],
            303: [  // JS Basics
                { type: "true_false", text: "JavaScript is case-sensitive.", options: ["True", "False"], correct: "True" },
                { type: "single_choice", text: "Which symbol is used for single-line comments?", options: ["//", "/*", "#", "<!--"], correct: "//" }
            ]
        };
        return questionBank[lessonId] || [
            { type: "true_false", text: "This is a sample practice question.", options: ["True", "False"], correct: "True" }
        ];
    },

    // ==================== Enrollment & Progress ====================
    isEnrolled: function(userId, courseId) {
        const enrollments = this.getEnrollments();
        return enrollments.some(e => e.userId === userId && e.courseId === courseId && e.status === 'active');
    },

    getEnrollmentByUserAndCourse: function(userId, courseId) {
        const enrollments = this.getEnrollments();
        return enrollments.find(e => e.userId === userId && e.courseId === courseId && e.status === 'active');
    },

    enroll: function(userId, courseId, paymentDetails = {}) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!userId) {
                    reject({ error: "User not logged in" });
                    return;
                }
                if (this.isEnrolled(userId, courseId)) {
                    reject({ error: "Already enrolled in this course" });
                    return;
                }
                const enrollments = this.getEnrollments();
                const now = new Date();
                const deadline = new Date();
                deadline.setMonth(deadline.getMonth() + 3);
                const newEnrollment = {
                    id: Date.now(),
                    userId: userId,
                    courseId: courseId,
                    enrolledAt: now.toISOString(),
                    deadline: deadline.toISOString(),
                    status: "active",
                    examAttemptsUsed: 0,
                    examAttemptsPurchased: 3,
                    certificateIssued: false
                };
                enrollments.push(newEnrollment);
                this.saveEnrollments(enrollments);
                resolve({ success: true, enrollment: newEnrollment });
            }, 800);
        });
    },

    getUserEnrollments: function(userId) {
        const all = this.getEnrollments();
        return all.filter(e => e.userId === userId);
    },

    markLessonComplete: function(enrollmentId, lessonId) {
        const progress = this.getLessonProgress(enrollmentId);
        if (!progress.completedLessonIds.includes(lessonId)) {
            progress.completedLessonIds.push(lessonId);
            this.saveLessonProgress(enrollmentId, progress.completedLessonIds);
        }
        return Promise.resolve({ success: true });
    },

    getCompletedLessons: function(enrollmentId) {
        return this.getLessonProgress(enrollmentId).completedLessonIds;
    },

    // ==================== Exam & Certificates ====================
    getUserCertificates: function(userId) {
        const enrollments = this.getEnrollments();
        const certs = enrollments.filter(e => e.userId === userId && e.certificateIssued === true);
        return Promise.resolve(certs);
    },

    issueCertificate: function(enrollmentId) {
        const enrollments = this.getEnrollments();
        const idx = enrollments.findIndex(e => e.id == enrollmentId);
        if (idx !== -1) {
            enrollments[idx].certificateIssued = true;
            enrollments[idx].status = "completed";
            this.saveEnrollments(enrollments);
            return Promise.resolve({ success: true });
        }
        return Promise.reject({ error: "Enrollment not found" });
    },

    recordExamAttempt: function(enrollmentId, passed) {
        const enrollments = this.getEnrollments();
        const idx = enrollments.findIndex(e => e.id == enrollmentId);
        if (idx !== -1) {
            const enrollment = enrollments[idx];
            enrollment.examAttemptsUsed++;
            if (passed) {
                enrollment.status = "completed";
                enrollment.certificateIssued = true;
            } else {
                if (enrollment.examAttemptsUsed >= (enrollment.examAttemptsPurchased || 3)) {
                    enrollment.status = "failed";
                }
            }
            this.saveEnrollments(enrollments);
            return Promise.resolve({ success: true, enrollment: enrollment });
        }
        return Promise.reject({ error: "Enrollment not found" });
    },

    getRemainingExamAttempts: function(enrollmentId) {
        const enrollments = this.getEnrollments();
        const enrollment = enrollments.find(e => e.id == enrollmentId);
        if (!enrollment) return 0;
        const totalAllowed = enrollment.examAttemptsPurchased || 3;
        const used = enrollment.examAttemptsUsed || 0;
        return Math.max(0, totalAllowed - used);
    },

    // ==================== Authentication ====================
    login: function(email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Admin hardcoded
            if (email === "admin@example.com" && password === "admin123") {
                this.currentUser = { id: 1, name: "Admin", email: email, role: "admin" };
                localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                resolve({ success: true, user: this.currentUser });
                return;
            }
            // Check registered users
            const storedUsers = localStorage.getItem("mock_users");
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                this.currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
                localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                resolve({ success: true, user: this.currentUser });
            } else {
                reject({ success: false, message: "Invalid email or password" });
            }
        }, 500);
    });
},

    restoreSession: function() {
        const stored = localStorage.getItem(this.STORAGE_KEYS.USER);
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
        return this.currentUser;
    },

    logout: function() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEYS.USER);
        return Promise.resolve({ success: true });
    },

    // ==================== Registration ====================
register: function(name, email, password) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!name || !email || !password) {
                reject({ success: false, message: "All fields are required" });
                return;
            }
            // Check if user already exists (by email)
            const storedUsers = localStorage.getItem("mock_users");
            let users = storedUsers ? JSON.parse(storedUsers) : [];
            if (users.find(u => u.email === email)) {
                reject({ success: false, message: "Email already registered" });
                return;
            }
            // Create new user
            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                password: password, // In real app, hash password
                role: "student"
            };
            users.push(newUser);
            localStorage.setItem("mock_users", JSON.stringify(users));
            // Auto-login after registration
            this.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: "student" };
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
            resolve({ success: true, user: this.currentUser });
        }, 500);
    });
},

    // ==================== Final Exam Question Bank ====================
getFinalExamQuestions: function(courseId) {
    // In a real app, fetch from DB. Here we return static banks per course.
    const banks = {
        1: [  // Python course
            { id: 1, text: "What is the correct file extension for Python files?", type: "single_choice", options: [".py", ".pt", ".pyt", ".p"], correct: ".py" },
            { id: 2, text: "Which of the following is a mutable data type in Python?", type: "single_choice", options: ["tuple", "list", "string", "int"], correct: "list" },
            { id: 3, text: "What does 'PEP' stand for?", type: "single_choice", options: ["Python Execution Protocol", "Python Enhancement Proposal", "Python Extended Package", "Python Exception Protocol"], correct: "Python Enhancement Proposal" },
            { id: 4, text: "Select all valid Python loop types.", type: "multiple_choice", options: ["for", "while", "do-while", "foreach"], correct: ["for", "while"] },
            { id: 5, text: "Python is a compiled language.", type: "true_false", options: ["True", "False"], correct: "False" },
            { id: 6, text: "Which keyword is used to define a function?", type: "combobox", options: ["def", "func", "define", "lambda"], correct: "def" },
            { id: 7, text: "What is the output of print(2**3)?", type: "single_choice", options: ["6", "8", "9", "5"], correct: "8" },
            { id: 8, text: "Which of the following are Python frameworks? (Select all)", type: "multiple_choice", options: ["Django", "Flask", "React", "Spring"], correct: ["Django", "Flask"] }
        ],
        2: [  // JavaScript course
            { id: 101, text: "Which symbol is used for strict equality?", type: "single_choice", options: ["==", "=", "===", "!=="], correct: "===" },
            { id: 102, text: "JavaScript is case-sensitive.", type: "true_false", options: ["True", "False"], correct: "True" },
            { id: 103, text: "Which keyword declares a variable in ES6?", type: "single_choice", options: ["var", "let", "const", "all of the above"], correct: "all of the above" }
        ]
    };
    return banks[courseId] || [
        { id: 999, text: "Sample exam question? (Course bank missing)", type: "true_false", options: ["True", "False"], correct: "True" }
    ];
},
// ==================== Admin & Role Management ====================
// Hardcoded admin user (for demo)
ADMIN_USER: { id: 1, name: "Admin", email: "admin@example.com", role: "admin" },

// Check if current user is admin
isAdmin: function() {
    return this.currentUser && this.currentUser.role === 'admin';
},

// Promote a user to admin (for demo)
setAdminUser: function() {
    if (this.currentUser && this.currentUser.email === "admin@example.com") {
        this.currentUser.role = "admin";
        localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
    }
},

// ==================== Course Management ====================
getAllCourses: function() {
    return Promise.resolve(this.courses);
},

addCourse: function(courseData) {
    return new Promise((resolve) => {
        const newId = Math.max(...this.courses.map(c => c.id), 0) + 1;
        const newCourse = {
            id: newId,
            title: courseData.title,
            description: courseData.description,
            price: parseFloat(courseData.price),
            modules: 0,
            lessons: 0,
            imagePlaceholder: "📘",
            syllabus: []
        };
        this.courses.push(newCourse);
        resolve({ success: true, course: newCourse });
    });
},

updateCourse: function(courseId, updates) {
    const idx = this.courses.findIndex(c => c.id == courseId);
    if (idx !== -1) {
        this.courses[idx] = { ...this.courses[idx], ...updates };
        return Promise.resolve({ success: true });
    }
    return Promise.reject("Course not found");
},

deleteCourse: function(courseId) {
    this.courses = this.courses.filter(c => c.id != courseId);
    return Promise.resolve({ success: true });
},

// ==================== Practice Questions Management ====================
getPracticeQuestionsForLessonAdmin: function(lessonId) {
    // Return current practice questions (mock)
    const allPractice = this.getAllPracticeQuestionsStore();
    return Promise.resolve(allPractice[lessonId] || []);
},

updatePracticeQuestions: function(lessonId, questions) {
    const store = this.getAllPracticeQuestionsStore();
    store[lessonId] = questions;
    localStorage.setItem("mock_practice_questions", JSON.stringify(store));
    return Promise.resolve({ success: true });
},

getAllPracticeQuestionsStore: function() {
    const stored = localStorage.getItem("mock_practice_questions");
    if (stored) return JSON.parse(stored);
    // Initialize from existing mock data
    const initial = {
        103: [ { type: "true_false", text: "Python uses indentation?", options: ["True","False"], correct: "True" } ],
        203: [ { type: "single_choice", text: "Which loop runs at least once?", options: ["for","while","do-while"], correct: "do-while" } ]
    };
    localStorage.setItem("mock_practice_questions", JSON.stringify(initial));
    return initial;
},

// ==================== Final Exam Questions Management ====================
getFinalExamQuestionsAdmin: function(courseId) {
    const bank = this.getFinalExamQuestions(courseId);
    return Promise.resolve(bank);
},

updateFinalExamQuestions: function(courseId, questions) {
    const store = this.getAllFinalExamStore();
    store[courseId] = questions;
    localStorage.setItem("mock_final_exam", JSON.stringify(store));
    return Promise.resolve({ success: true });
},

getAllFinalExamStore: function() {
    const stored = localStorage.getItem("mock_final_exam");
    if (stored) return JSON.parse(stored);
    // Initialize from existing static banks
    const initial = {
        1: [ /* python questions as in getFinalExamQuestions */ ],
        2: [ /* js questions */ ]
    };
    localStorage.setItem("mock_final_exam", JSON.stringify(initial));
    return initial;
},

// Override getFinalExamQuestions to use stored version
getFinalExamQuestions: function(courseId) {
    const store = this.getAllFinalExamStore();
    if (store[courseId] && store[courseId].length) {
        return store[courseId];
    }
    // Fallback static
    const banks = {
        1: [
            { id: 1, text: "What is the correct file extension for Python files?", type: "single_choice", options: [".py", ".pt"], correct: ".py" },
            { id: 2, text: "Python is compiled?", type: "true_false", options: ["True","False"], correct: "False" }
        ],
        2: [
            { id: 101, text: "Which symbol for strict equality?", type: "single_choice", options: ["==","==="], correct: "===" }
        ]
    };
    return banks[courseId] || [];
},

// ==================== Analytics ====================
getAnalytics: function() {
    const enrollments = this.getEnrollments();
    const courses = this.courses;
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const totalRevenue = enrollments.reduce((sum, e) => {
        const course = courses.find(c => c.id == e.courseId);
        return sum + (course ? course.price : 0);
    }, 0);
    const passRate = totalEnrollments ? (completedEnrollments / totalEnrollments * 100).toFixed(1) : 0;

    // Per-course analytics
    const courseStats = courses.map(course => {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const completions = courseEnrollments.filter(e => e.status === 'completed').length;
        const avgProgress = 0; // would need lesson progress aggregated, skip for mock
        return {
            courseId: course.id,
            title: course.title,
            enrollments: courseEnrollments.length,
            completions: completions,
            revenue: courseEnrollments.length * course.price
        };
    });
    return Promise.resolve({
        totalEnrollments,
        completedEnrollments,
        totalRevenue,
        passRate,
        courseStats
    });
}
};

// Auto-restore session on load
MOCK_API.restoreSession();