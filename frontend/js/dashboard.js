// mock-api.js
// Complete mock backend for the learning platform
// Uses localStorage to persist users, enrollments, lesson progress, exam attempts, and certificates

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
            syllabus: []
        }
    ],

    // LocalStorage keys
    STORAGE_KEYS: {
        ENROLLMENTS: "mock_enrollments",
        USER: "mock_user",
        USERS: "mock_users",
        LESSON_PROGRESS: "mock_lesson_progress",
        CERTIFICATES: "mock_certificates",
        PRACTICE_QUESTIONS: "mock_practice_questions",
        FINAL_EXAM: "mock_final_exam"
    },

    // ==================== Helper Methods ====================
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

                if (foundLesson.content_type === 'video') {
                    foundLesson.content = {
                        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=placeholder",
                        transcript: "This is a mock video lesson content."
                    };
                } else if (foundLesson.content_type === 'text') {
                    foundLesson.content = {
                        text: `<p>This is a sample text lesson for <strong>${foundLesson.title}</strong>.</p>
                               <p>Here you would learn key concepts, see examples, and read explanations.</p>`
                    };
                } else if (foundLesson.content_type === 'quiz' && foundLesson.practice_questions) {
                    foundLesson.practiceQuestions = this.getPracticeQuestionsForLesson(courseId, lessonId);
                }
                resolve(foundLesson);
            }, 200);
        });
    },

    getPracticeQuestionsForLesson: function(courseId, lessonId) {
        const stored = localStorage.getItem(this.STORAGE_KEYS.PRACTICE_QUESTIONS);
        const allPractice = stored ? JSON.parse(stored) : {};
        
        if (allPractice[lessonId]) return allPractice[lessonId];
        
        const defaultBank = {
            103: [
                { type: "true_false", text: "Python uses indentation to define code blocks.", options: ["True", "False"], correct: "True" },
                { type: "single_choice", text: "Which of these is a valid variable name?", options: ["2var", "_var", "var-name", "var name"], correct: "_var" },
                { type: "multiple_choice", text: "Which of the following are Python data types?", options: ["int", "float", "char", "string"], correct: ["int", "float", "string"] },
                { type: "combobox", text: "What keyword is used to define a function in Python?", options: ["def", "func", "define", "function"], correct: "def" }
            ],
            203: [
                { type: "true_false", text: "A 'for' loop can iterate over a list.", options: ["True", "False"], correct: "True" },
                { type: "single_choice", text: "What does 'range(5)' produce?", options: ["0,1,2,3,4", "1,2,3,4,5", "0,1,2,3,4,5"], correct: "0,1,2,3,4" }
            ],
            303: [
                { type: "true_false", text: "JavaScript is case-sensitive.", options: ["True", "False"], correct: "True" }
            ]
        };
        return defaultBank[lessonId] || [{ type: "true_false", text: "Sample practice question.", options: ["True", "False"], correct: "True" }];
    },

    // ==================== Enhanced User Management ====================
    register: function(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const { firstName, lastName, email, phone, country, city, dob, password } = userData;
                
                if (!firstName || !lastName || !email || !phone || !country || !password) {
                    reject({ success: false, message: "All required fields must be filled" });
                    return;
                }
                
                const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
                let users = storedUsers ? JSON.parse(storedUsers) : [];
                if (users.find(u => u.email === email)) {
                    reject({ success: false, message: "Email already registered" });
                    return;
                }
                
                const newUser = {
                    id: Date.now(),
                    firstName: firstName,
                    lastName: lastName,
                    fullName: `${firstName} ${lastName}`,
                    email: email,
                    phone: phone,
                    country: country,
                    city: city || "",
                    dob: dob || "",
                    password: password,
                    role: "student",
                    createdAt: new Date().toISOString(),
                    profileImage: null
                };
                users.push(newUser);
                localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
                
                this.currentUser = {
                    id: newUser.id,
                    name: newUser.fullName,
                    email: newUser.email,
                    role: "student",
                    profile: newUser
                };
                localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                resolve({ success: true, user: this.currentUser });
            }, 500);
        });
    },

    login: function(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === "admin@example.com" && password === "admin123") {
                    this.currentUser = { id: 1, name: "Admin", email: email, role: "admin" };
                    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                    resolve({ success: true, user: this.currentUser });
                    return;
                }
                
                const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
                const users = storedUsers ? JSON.parse(storedUsers) : [];
                const user = users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    this.currentUser = {
                        id: user.id,
                        name: user.fullName,
                        email: user.email,
                        role: user.role,
                        profile: user
                    };
                    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                    resolve({ success: true, user: this.currentUser });
                } else {
                    reject({ success: false, message: "Invalid email or password" });
                }
            }, 500);
        });
    },

    updateUserProfile: function(userId, updates) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
                let users = storedUsers ? JSON.parse(storedUsers) : [];
                const userIndex = users.findIndex(u => u.id == userId);
                
                if (userIndex === -1) {
                    reject({ error: "User not found" });
                    return;
                }
                
                users[userIndex] = { ...users[userIndex], ...updates };
                users[userIndex].fullName = `${users[userIndex].firstName} ${users[userIndex].lastName}`;
                localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
                
                if (this.currentUser && this.currentUser.id == userId) {
                    this.currentUser.name = users[userIndex].fullName;
                    this.currentUser.profile = users[userIndex];
                    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
                }
                
                resolve({ success: true, user: users[userIndex] });
            }, 500);
        });
    },

    changePassword: function(userId, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
                let users = storedUsers ? JSON.parse(storedUsers) : [];
                const user = users.find(u => u.id == userId);
                
                if (!user) {
                    reject({ error: "User not found" });
                    return;
                }
                
                if (user.password !== oldPassword) {
                    reject({ error: "Current password is incorrect" });
                    return;
                }
                
                if (newPassword.length < 4) {
                    reject({ error: "Password must be at least 4 characters" });
                    return;
                }
                
                user.password = newPassword;
                localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
                resolve({ success: true });
            }, 500);
        });
    },

    getUserProfile: function(userId) {
        const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        const user = users.find(u => u.id == userId);
        return Promise.resolve(user || null);
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

    isAdmin: function() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    // ==================== Enrollment & Progress ====================
    isEnrolled: function(userId, courseId) {
        const enrollments = this.getEnrollments();
        return enrollments.some(e => e.userId === userId && e.courseId === courseId && e.status === 'active');
    },

    getEnrollmentByUserAndCourse: function(userId, courseId) {
        const enrollments = this.getEnrollments();
        return enrollments.find(e => e.userId === userId && e.courseId === courseId);
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
    getRemainingExamAttempts: function(enrollmentId) {
        const enrollments = this.getEnrollments();
        const enrollment = enrollments.find(e => e.id == enrollmentId);
        if (!enrollment) return 0;
        const totalAllowed = enrollment.examAttemptsPurchased || 3;
        const used = enrollment.examAttemptsUsed || 0;
        return Math.max(0, totalAllowed - used);
    },

    recordExamAttempt: function(enrollmentId, passed, score = null) {
        const enrollments = this.getEnrollments();
        const idx = enrollments.findIndex(e => e.id == enrollmentId);
        if (idx !== -1) {
            const enrollment = enrollments[idx];
            enrollment.examAttemptsUsed++;
            if (passed) {
                enrollment.examScore = score || 85;
                this.issueCertificate(enrollmentId, score);
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

    generateCertificateUUID: function() {
        return 'cert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    issueCertificate: function(enrollmentId, score = 85) {
        const enrollments = this.getEnrollments();
        const idx = enrollments.findIndex(e => e.id == enrollmentId);
        if (idx !== -1) {
            const enrollment = enrollments[idx];
            if (enrollment.certificateIssued) {
                return Promise.resolve({ success: true, alreadyIssued: true });
            }
            
            const course = this.courses.find(c => c.id == enrollment.courseId);
            
            // Get user details
            const storedUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            const user = users.find(u => u.id == enrollment.userId);
            
            const certificate = {
                id: Date.now(),
                uuid: this.generateCertificateUUID(),
                enrollmentId: enrollment.id,
                userId: enrollment.userId,
                userName: user ? `${user.firstName} ${user.lastName}` : "Student",
                userEmail: user ? user.email : "",
                courseId: enrollment.courseId,
                courseTitle: course ? course.title : "Course",
                issuedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                score: score
            };
            
            const storedCerts = localStorage.getItem(this.STORAGE_KEYS.CERTIFICATES);
            const allCerts = storedCerts ? JSON.parse(storedCerts) : [];
            allCerts.push(certificate);
            localStorage.setItem(this.STORAGE_KEYS.CERTIFICATES, JSON.stringify(allCerts));
            
            enrollment.certificateIssued = true;
            enrollment.certificateUUID = certificate.uuid;
            enrollment.status = "completed";
            this.saveEnrollments(enrollments);
            
            return Promise.resolve({ success: true, certificate: certificate });
        }
        return Promise.reject({ error: "Enrollment not found" });
    },

    getCertificateByUUID: function(uuid) {
        const storedCerts = localStorage.getItem(this.STORAGE_KEYS.CERTIFICATES);
        const allCerts = storedCerts ? JSON.parse(storedCerts) : [];
        const cert = allCerts.find(c => c.uuid === uuid);
        if (cert) {
            return Promise.resolve(cert);
        }
        return Promise.reject({ error: "Certificate not found" });
    },

    getUserCertificates: function(userId) {
        const storedCerts = localStorage.getItem(this.STORAGE_KEYS.CERTIFICATES);
        const allCerts = storedCerts ? JSON.parse(storedCerts) : [];
        const userCerts = allCerts.filter(c => c.userId == userId);
        return Promise.resolve(userCerts);
    },

    getCertificateForEnrollment: function(enrollmentId) {
        const storedCerts = localStorage.getItem(this.STORAGE_KEYS.CERTIFICATES);
        const allCerts = storedCerts ? JSON.parse(storedCerts) : [];
        const cert = allCerts.find(c => c.enrollmentId == enrollmentId);
        return Promise.resolve(cert || null);
    },

    // ==================== Final Exam Questions ====================
    getFinalExamQuestions: function(courseId) {
        const stored = localStorage.getItem(this.STORAGE_KEYS.FINAL_EXAM);
        const allBanks = stored ? JSON.parse(stored) : {};
        
        if (allBanks[courseId] && allBanks[courseId].length) {
            return allBanks[courseId];
        }
        
        const defaultBanks = {
            1: [
                { id: 1, text: "What is the correct file extension for Python files?", type: "single_choice", options: [".py", ".pt", ".pyt"], correct: ".py" },
                { id: 2, text: "Which of the following is a mutable data type?", type: "single_choice", options: ["tuple", "list", "string"], correct: "list" },
                { id: 3, text: "Python is a compiled language.", type: "true_false", options: ["True", "False"], correct: "False" },
                { id: 4, text: "Select all valid Python loop types.", type: "multiple_choice", options: ["for", "while", "do-while"], correct: ["for", "while"] },
                { id: 5, text: "Which keyword defines a function?", type: "combobox", options: ["def", "func", "define"], correct: "def" }
            ],
            2: [
                { id: 101, text: "Which symbol is used for strict equality?", type: "single_choice", options: ["==", "===", "="], correct: "===" },
                { id: 102, text: "JavaScript is case-sensitive.", type: "true_false", options: ["True", "False"], correct: "True" }
            ]
        };
        return defaultBanks[courseId] || [];
    },

    // ==================== Admin Methods ====================
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

    updatePracticeQuestions: function(lessonId, questions) {
        const stored = localStorage.getItem(this.STORAGE_KEYS.PRACTICE_QUESTIONS);
        const allPractice = stored ? JSON.parse(stored) : {};
        allPractice[lessonId] = questions;
        localStorage.setItem(this.STORAGE_KEYS.PRACTICE_QUESTIONS, JSON.stringify(allPractice));
        return Promise.resolve({ success: true });
    },

    updateFinalExamQuestions: function(courseId, questions) {
        const stored = localStorage.getItem(this.STORAGE_KEYS.FINAL_EXAM);
        const allBanks = stored ? JSON.parse(stored) : {};
        allBanks[courseId] = questions;
        localStorage.setItem(this.STORAGE_KEYS.FINAL_EXAM, JSON.stringify(allBanks));
        return Promise.resolve({ success: true });
    },

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

        const courseStats = courses.map(course => {
            const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
            return {
                courseId: course.id,
                title: course.title,
                enrollments: courseEnrollments.length,
                completions: courseEnrollments.filter(e => e.status === 'completed').length,
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

// Initialize demo admin if no users exist
const existingUsers = localStorage.getItem(MOCK_API.STORAGE_KEYS.USERS);
if (!existingUsers) {
    const defaultUsers = [
        {
            id: 1,
            firstName: "Admin",
            lastName: "User",
            fullName: "Admin User",
            email: "admin@example.com",
            phone: "+1234567890",
            country: "USA",
            city: "New York",
            dob: "1990-01-01",
            password: "admin123",
            role: "admin",
            createdAt: new Date().toISOString(),
            profileImage: null
        }
    ];
    localStorage.setItem(MOCK_API.STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
}