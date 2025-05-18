// File: routes/hospitals.js
import express from 'express';
import bcrypt from 'bcryptjs';
import Hospital from '../models/Hospital.js';
import Department from '../models/Department.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// @route   GET /api/hospitals
// @desc    Get all hospitals
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const hospitals = await Hospital.find().select('-adminPassword -doctorPassword -receptionistPassword');
    
    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching hospitals'
    });
  }
});

// @route   GET /api/hospitals/:id
// @desc    Get single hospital
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select('-adminPassword -doctorPassword -receptionistPassword');
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching hospital'
    });
  }
});

// @route   POST /api/hospitals
// @desc    Create new hospital
// @access  Private/Admin (Super admin functionality)
router.post('/', protect, authorize('Admin'), async (req, res, next) => {
  try {
    const { name, adminPassword, doctorPassword, receptionistPassword, coordinates, services } = req.body;
    
    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ name });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'Hospital with this name already exists'
      });
    }
    
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
    const hashedDoctorPassword = await bcrypt.hash(doctorPassword, salt);
    const hashedReceptionistPassword = await bcrypt.hash(receptionistPassword, salt);
    
    // Create hospital
    const hospital = await Hospital.create({
      name,
      adminPassword: hashedAdminPassword,
      doctorPassword: hashedDoctorPassword,
      receptionistPassword: hashedReceptionistPassword,
      coordinates,
      services
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: hospital._id,
        name: hospital.name,
        coordinates: hospital.coordinates,
        services: hospital.services
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating hospital'
    });
  }
});

// @route   PUT /api/hospitals/:id
// @desc    Update hospital
// @access  Private/Admin
router.put('/:id', protect, authorize('Admin'), async (req, res, next) => {
  try {
    // Check if hospital exists
    let hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    // Check if admin belongs to this hospital
    if (req.user.hospitalId.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hospital'
      });
    }
    
    // Handle password updates if provided
    const updateData = { ...req.body };
    
    if (updateData.adminPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.adminPassword = await bcrypt.hash(updateData.adminPassword, salt);
    }
    
    if (updateData.doctorPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.doctorPassword = await bcrypt.hash(updateData.doctorPassword, salt);
    }
    
    if (updateData.receptionistPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.receptionistPassword = await bcrypt.hash(updateData.receptionistPassword, salt);
    }
    
    // Update hospital
    hospital = await Hospital.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-adminPassword -doctorPassword -receptionistPassword');
    
    res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating hospital'
    });
  }
});

// @route   GET /api/hospitals/:id/departments
// @desc    Get all departments of a hospital
// @access  Public
router.get('/:id/departments', async (req, res, next) => {
  try {
    const departments = await Department.find({ hospitalId: req.params.id });
    
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

export default router;
