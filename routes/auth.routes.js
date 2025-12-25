const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');
const { protect } = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', protect, authController.getMe);
router.patch('/update-profile', protect, authController.updateProfile);
router.patch('/change-password', protect, authController.changePassword);

module.exports = router;