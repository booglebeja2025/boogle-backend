const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validateCourseEnrollment } = require('../middlewares/validation.middleware');

// All dashboard routes require authentication
router.use(protect);

// Dashboard main routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/analytics', dashboardController.getLearningAnalytics);
router.get('/notifications', dashboardController.getNotifications);

// Course management
router.post('/enroll', validateCourseEnrollment, dashboardController.enrollCourse);
router.patch('/progress', dashboardController.updateProgress);

module.exports = router;