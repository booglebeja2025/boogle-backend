const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  // Set cookie
  res.cookie('token', token, cookieOptions);
  
  successResponse(res, {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      enrolledCourses: user.enrolledCourses,
      overallProgress: user.overallProgress
    }
  }, 'Authentication successful', statusCode);
};

// Register User
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }
    
    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'student'
    });
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Send token response
    createSendToken(user, 201, res);
    
  } catch (error) {
    console.error('Registration error:', error);
    errorResponse(res, 'Registration failed', 500);
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return errorResponse(res, 'Please provide email and password', 400);
    }
    
    // Find user and include password
    const user = await User.findOne({ email }).select('+password +isActive');
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 'Invalid email or password', 401);
    }
    
    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated', 403);
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Send token response
    createSendToken(user, 200, res);
    
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed', 500);
  }
};

// Logout User
exports.logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });
  
  successResponse(res, null, 'Logged out successfully');
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('enrolledCourses.courseId', 'title description icon')
      .select('-__v -password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    successResponse(res, {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        enrolledCourses: user.enrolledCourses,
        overallProgress: user.overallProgress,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get me error:', error);
    errorResponse(res, 'Failed to get user data', 500);
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, avatar, bio } = req.body;
    const allowedUpdates = { fullName, avatar, bio };
    
    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password -__v');
    
    successResponse(res, { user }, 'Profile updated successfully');
    
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 'Failed to update profile', 500);
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Send new token
    createSendToken(user, 200, res);
    
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, 'Failed to change password', 500);
  }
};