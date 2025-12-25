const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/response');

// Submit Contact Form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, category, phone } = req.body;
    
    // Get client information
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      category: category || 'general',
      ipAddress,
      userAgent
    });
    
    // In production, you would:
    // 1. Send email notification to admin
    // 2. Send auto-response to user
    // 3. Log to monitoring system
    
    successResponse(res, { 
      contactId: contact._id,
      submittedAt: contact.createdAt 
    }, 'Thank you for contacting us. We will get back to you soon.', 201);
    
  } catch (error) {
    console.error('Contact submission error:', error);
    errorResponse(res, 'Failed to submit contact form', 500);
  }
};

// Get Contact Submissions (Admin only)
exports.getContacts = async (req, res) => {
  try {
    const { status, category, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    // Get total count
    const total = await Contact.countDocuments(query);
    
    successResponse(res, {
      contacts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get contacts error:', error);
    errorResponse(res, 'Failed to fetch contacts', 500);
  }
};

// Get Single Contact (Admin only)
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return errorResponse(res, 'Contact not found', 404);
    }
    
    successResponse(res, { contact });
    
  } catch (error) {
    console.error('Get contact error:', error);
    errorResponse(res, 'Failed to fetch contact', 500);
  }
};

// Update Contact Status (Admin only)
exports.updateContact = async (req, res) => {
  try {
    const { status, priority, response } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (response) {
      updateData.response = {
        message: response.message,
        respondedBy: req.user.id,
        respondedAt: new Date()
      };
      updateData.responded = true;
    }
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return errorResponse(res, 'Contact not found', 404);
    }
    
    successResponse(res, { contact }, 'Contact updated successfully');
    
  } catch (error) {
    console.error('Update contact error:', error);
    errorResponse(res, 'Failed to update contact', 500);
  }
};

// Get Contact Statistics (Admin only)
exports.getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $facet: {
          // Count by status
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          
          // Count by category
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          
          // Count by day (last 30 days)
          byDay: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          
          // Average response time
          avgResponseTime: [
            { $match: { responded: true } },
            {
              $addFields: {
                responseTime: { $subtract: ['$response.respondedAt', '$createdAt'] }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$responseTime' },
                minTime: { $min: '$responseTime' },
                maxTime: { $max: '$responseTime' }
              }
            }
          ]
        }
      }
    ]);
    
    successResponse(res, { stats: stats[0] });
    
  } catch (error) {
    console.error('Get contact stats error:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
};