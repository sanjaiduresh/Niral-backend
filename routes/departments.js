// File: routes/departments.js
import express from 'express';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    // Allow filtering by hospital
    let query = {};
    if (req.query.hospitalId) {
      query.hospitalId = req.query.hospitalId;
    }
    
    const departments = await Department.find(query);
    
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching departments'
    });
  }
});

// @route   GET /api/departments/:id
// @desc    Get single department
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching department'
    });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private/Admin
router.post('/', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    // Make sure the admin can only create departments for their hospital
    const hospitalId = req.user.hospitalId;
    
    // Check if department already exists in this hospital
    const existingDepartment = await Department.findOne({ 
      name,
      hospitalId
    });
    
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists in this hospital'
      });
    }
    
    // Create department
    const department = await Department.create({
      name,
      description,
      hospitalId
    });
    
    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating department'
    });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    // Check if department exists
    let department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Check if admin belongs to the hospital that has this department
    if (req.user.hospitalId.toString() !== department.hospitalId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this department'
      });
    }
    
    // Update department
    department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating department'
    });
  }
});

// @route   GET /api/departments/:id/doctors
// @desc    Get all doctors in a department
// @access  Public
router.get('/:id/doctors', async (req, res, next) => {
  try {
    const doctors = await User.find({ 
      departmentId: req.params.id,
      role: 'Doctor'
    }).select('-password');
    
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching doctors'
    });
  }
});

export default router;
