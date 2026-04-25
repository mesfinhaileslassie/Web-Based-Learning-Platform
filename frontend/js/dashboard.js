// dashboard.js

let currentUser = null;

async function loadDashboard() {
    const user = MOCK_API.currentUser;
    currentUser = user;
    
    if (!user) {
        document.getElementById('welcomeMessage').innerHTML = '<div class="alert alert-info">Please login to view your dashboard. <a href="login.html">Login now</a></div>';
        document.getElementById('enrollmentsContainer').innerHTML = '';
        document.getElementById('certificatesContainer').innerHTML = '';
        return;
    }

    document.getElementById('welcomeMessage').innerHTML = `<p>Welcome back, ${user.name}!</p>`;

    // Load enrollments
    const enrollments = MOCK_API.getUserEnrollments(user.id);
    
    // Clear loading and show enrollments or empty message
    if (enrollments.length === 0) {
        document.getElementById('enrollmentsContainer').innerHTML = '<div class="empty-state">📭 You haven’t enrolled in any courses yet. <a href="index.html">Browse courses</a></div>';
    } else {
        let html = '<div class="dashboard-grid">';
        for (const enrollment of enrollments) {
            try {
                const course = await MOCK_API.getCourseDetail(enrollment.courseId);
                const allLessons = MOCK_API.getCourseLessonList(course.id);
                const completedLessons = await MOCK_API.getCompletedLessons(enrollment.id);
                const progressPercent = allLessons.length ? (completedLessons.length / allLessons.length) * 100 : 0;
                const remainingAttempts = MOCK_API.getRemainingExamAttempts(enrollment.id);
                const deadline = new Date(enrollment.deadline);
                const now = new Date();
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft < 0;
                const isCompleted = enrollment.status === 'completed';
                const isFailed = enrollment.status === 'failed';

                let statusBadge = '';
                if (isCompleted) statusBadge = '<span class="certificate-badge">✅ Completed</span>';
                else if (isFailed) statusBadge = '<span class="certificate-badge" style="background:#fee2e2;color:#991b1b;">❌ Failed</span>';
                else if (isExpired) statusBadge = '<span class="certificate-badge" style="background:#fee2e2;color:#991b1b;">⏰ Expired</span>';

                let examButton = '';
                if (!isCompleted && !isFailed && !isExpired && remainingAttempts > 0) {
                    examButton = `<button class="btn btn-sm exam-btn" data-enrollment-id="${enrollment.id}" data-course-id="${course.id}">📝 Take Final Exam (${remainingAttempts} attempts left)</button>`;
                } else if (!isCompleted && !isFailed && !isExpired && remainingAttempts === 0) {
                    examButton = `<button class="btn btn-sm btn-outline" disabled>No attempts left. <a href="#" class="buy-attempts-link" data-enrollment-id="${enrollment.id}">Buy more?</a></button>`;
                } else if (isCompleted) {
                    examButton = `<button class="btn btn-sm btn-outline" disabled>Exam passed ✓</button>`;
                }

                html += `
                    <div class="enrollment-card">
                        <h3>${course.title} ${statusBadge}</h3>
                        <div class="deadline ${daysLeft <= 7 && daysLeft > 0 ? 'urgent' : ''}">
                            ⏰ Deadline: ${deadline.toLocaleDateString()} 
                            ${!isExpired && !isCompleted ? `(${daysLeft} days left)` : ''}
                            ${isExpired ? '(Expired)' : ''}
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div>Progress: ${completedLessons.length} / ${allLessons.length} lessons</div>
                        ${examButton}
                        <a href="learn.html?course_id=${course.id}" class="btn btn-sm">Continue Learning →</a>
                    </div>
                `;
            } catch (err) {
                console.error("Error loading course for enrollment:", err);
            }
        }
        html += '</div>';
        document.getElementById('enrollmentsContainer').innerHTML = html;

        // Attach exam button events
        document.querySelectorAll('.exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const enrollmentId = btn.dataset.enrollmentId;
                const courseId = btn.dataset.courseId;
                window.location.href = `exam.html?enrollment_id=${enrollmentId}&course_id=${courseId}`;
            });
        });
        document.querySelectorAll('.buy-attempts-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Payment for extra attempts would go here. (Mock)");
            });
        });
    }

    // Load certificates
    const certificates = await MOCK_API.getUserCertificates(user.id);
    if (certificates.length === 0) {
        document.getElementById('certificatesContainer').innerHTML = '<div class="empty-state">🏆 No certificates yet. Pass a final exam to earn one.</div>';
    } else {
        let certHtml = '<div class="dashboard-grid">';
        for (const cert of certificates) {
            try {
                const course = await MOCK_API.getCourseDetail(cert.courseId);
                certHtml += `
                    <div class="enrollment-card certificate-card">
                        <h3>🏅 ${course.title}</h3>
                        <p>Issued: ${new Date(cert.enrolledAt).toLocaleDateString()}</p>
                        <button class="btn btn-sm view-cert" data-cert-id="${cert.id}" data-course-id="${course.id}">View Certificate</button>
                    </div>
                `;
            } catch (err) {
                console.error("Error loading certificate course:", err);
            }
        }
        certHtml += '</div>';
        document.getElementById('certificatesContainer').innerHTML = certHtml;

        document.querySelectorAll('.view-cert').forEach(btn => {
            btn.addEventListener('click', () => {
                alert("Certificate view will be implemented next. (Mock)");
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});