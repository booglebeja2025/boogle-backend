const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { validateContact } = require('../middlewares/validation.middleware');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

// Public route - anyone can submit contact form
router.post('/submit', validateContact, contactController.submitContact);

// Protected routes - Admin only
router.get('/', protect, restrictTo('admin'), contactController.getContacts);
router.get('/stats', protect, restrictTo('admin'), contactController.getContactStats);
router.get('/:id', protect, restrictTo('admin'), contactController.getContact);
router.patch('/:id', protect, restrictTo('admin'), contactController.updateContact);

module.exports = router;