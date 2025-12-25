const User = require('../models/User');
const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/response');

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data with enrolled courses
    const user = await User.findById(userId)
      .populate('enrolledCourses.courseId', 'title description icon level')
      .select('enrolledCourses overallProgress');
    
    // Get recent activities (simulated - in real app, you'd have an Activity model)
    const recentActivities = [
      {
        type: 'course_started',
        title: 'HTML & CSS Mastery',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        progress: 25
      },
      {
        type: 'quiz_completed',
        title: 'CSS Flexbox Quiz',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        score: 95
      },
      {
        type: 'assignment_submitted',
        title: 'Responsive Layout Project',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        status: 'pending'
      }
    ];
    
    // Calculate statistics
    const totalCourses = user.enrolledCourses.length;
    const completedCourses = user.enrolledCourses.filter(course => course.progress === 100).length;
    const averageProgress = user.overallProgress;
    
    // Get upcoming deadlines (simulated)
    const upcomingDeadlines = [
      {
        course: 'JavaScript Pro',
        assignment: 'ES6+ Features Assignment',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'high'
      },
      {
        course: 'HTML & CSS Mastery',
        assignment: 'Final Project',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'medium'
      }
    ];
    
    successResponse(res, {
      stats: {
        totalCourses,
        completedCourses,
        averageProgress,
        learningStreak: Math.floor(Math.random() * 30) // Simulated
      },
      enrolledCourses: user.enrolledCourses,
      recentActivities,
      upcomingDeadlines,
      recommendations: [
        {
          title: 'Advanced CSS Animations',
          description: 'Master CSS animations and transitions',
          difficulty: 'Intermediate',
          estimatedTime: '8 hours'
        },
        {
          title: 'JavaScript Algorithms',
          description: 'Practice common algorithms and data structures',
          difficulty: 'Advanced',
          estimatedTime: '15 hours'
        }
      ]
    });
    
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
};

// Enroll in Course
exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    
    // Check if already enrolled
    const user = await User.findById(userId);
    const alreadyEnrolled = user.enrolledCourses.some(
      course => course.courseId.toString() === courseId
    );
    
    if (alreadyEnrolled) {
      return errorResponse(res, 'Already enrolled in this course', 400);
    }
    
    // Add course to enrolled courses
    user.enrolledCourses.push({
      courseId,
      enrolledAt: new Date(),
      progress: 0
    });
    
    await user.save();
    
    successResponse(res, {
      enrollment: {
        courseId,
        enrolledAt: user.enrolledCourses[user.enrolledCourses.length - 1].enrolledAt,
        progress: 0
      }
    }, 'Successfully enrolled in course', 201);
    
  } catch (error) {
    console.error('Enroll course error:', error);
    errorResponse(res, 'Failed to enroll in course', 500);
  }
};

// Update Course Progress
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, progress } = req.body;
    const userId = req.user.id;
    
    // Validate progress
    if (progress < 0 || progress > 100) {
      return errorResponse(res, 'Progress must be between 0 and 100', 400);
    }
    
    // Find user and update progress
    const user = await User.findById(userId);
    const courseIndex = user.enrolledCourses.findIndex(
      course => course.courseId.toString() === courseId
    );
    
    if (courseIndex === -1) {
      return errorResponse(res, 'Course not found in enrolled courses', 404);
    }
    
    // Update progress
    user.enrolledCourses[courseIndex].progress = progress;
    user.enrolledCourses[courseIndex].lastAccessed = new Date();
    
    await user.save();
    
    successResponse(res, {
      courseId,
      progress,
      updatedAt: new Date()
    }, 'Progress updated successfully');
    
  } catch (error) {
    console.error('Update progress error:', error);
    errorResponse(res, 'Failed to update progress', 500);
  }
};

// Get Learning Analytics
exports.getLearningAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Simulated analytics data
    // In production, you would query from actual learning logs
    const timeSpentData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      minutes: Math.floor(Math.random() * 180) + 30
    }));
    
    const progressData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
      progress: Math.min(100, 20 + i * 15 + Math.random() * 10)
    }));
    
    const skillDistribution = [
      { skill: 'HTML/CSS', level: 85 },
      { skill: 'JavaScript', level: 65 },
      { skill: 'React', level: 45 },
      { skill: 'Node.js', level: 40 },
      { skill: 'Database', level: 35 }
    ];
    
    successResponse(res, {
      period,
      startDate,
      endDate,
      analytics: {
        timeSpent: timeSpentData,
        progress: progressData,
        skillDistribution,
        averageDailyTime: Math.round(
          timeSpentData.reduce((sum, day) => sum + day.minutes, 0) / timeSpentData.length
        ),
        completionRate: Math.round(Math.random() * 30 + 50) // Simulated
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    errorResponse(res, 'Failed to fetch analytics', 500);
  }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    // Simulated notifications
    // In production, you would have a Notification model
    const notifications = [
      {
        id: '1',
        type: 'course_update',
        title: 'New Module Available',
        message: 'A new module has been added to "JavaScript Pro" course',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '2',
        type: 'assignment_reminder',
        title: 'Assignment Due Soon',
        message: 'Your CSS Grid assignment is due in 2 days',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
        priority: 'high'
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Learning Streak!',
        message: 'You have a 7-day learning streak! Keep it up!',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        priority: 'low'
      }
    ];
    
    successResponse(res, {
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    errorResponse(res, 'Failed to fetch notifications', 500);
  }
};