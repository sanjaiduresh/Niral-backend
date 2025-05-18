// File: routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import Hospital from '../models/Hospital.js';
import Department from '../models/Department.js';
import { protect, authorize } from '../middlewares/auth.js';
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, hospitalName, age, bloodtype, contact, specialty, departmentId, description, workingdays } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user object
    const userData = {
      name,
      email,
      password,
      role
    };

    // Handle role-specific data
    if (['Admin', 'Doctor', 'Receptionist'].includes(role)) {
      // Find hospital by name
      const hospital = await Hospital.findOne({ name: hospitalName });
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }

      userData.hospitalId = hospital._id;

      // Verify hospital passwords based on role
      const passwordField = `${role.toLowerCase()}Password`;
      const passwordToCheck = req.body[`hospital${role}pass`];
      
      // Get hospital with password field included
      const hospitalWithPassword = await Hospital.findById(hospital._id).select(`+${passwordField}`);
      
      const isPasswordValid = await bcrypt.compare(passwordToCheck, hospitalWithPassword[passwordField]);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: `Invalid ${role.toLowerCase()} password for this hospital`
        });
      }

      // Additional fields for doctor
      if (role === 'Doctor') {
        userData.specialty = specialty;
        userData.description = description;
        userData.workingdays = workingdays;
        
        // Verify department belongs to the hospital
        const department = await Department.findOne({ 
          _id: departmentId,
          hospitalId: hospital._id 
        });
        
        if (!department) {
          return res.status(404).json({
            success: false,
            message: 'Department not found in this hospital'
          });
        }
        
        userData.departmentId = department._id;
      }
    }

    // Additional fields for patient
    if (role === 'Patient') {
      userData.age = age;
      userData.bloodtype = bloodtype;
      userData.contact = contact;
    }

    // Create user
    const user = await User.create(userData);

    // Create token
    const token = user.getSignedJwtToken();

    // Return response
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate email and password
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and role'
      });
    }

    // Check for user
    const user = await User.findOne({ email, role }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = user.getSignedJwtToken();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching user'
    });
  }
});

export default router;
