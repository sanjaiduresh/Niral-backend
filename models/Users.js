// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['Admin', 'Patient', 'Doctor', 'Receptionist', 'Inventoryman'],
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: function() {
      return ['Admin', 'Doctor', 'Receptionist'].includes(this.role);
    }
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role === 'Doctor';
    }
  },
  specialty: {
    type: String,
    required: function() {
      return this.role === 'Doctor';
    }
  },
  workingdays: {
    type: [String],
    required: function() {
      return this.role === 'Doctor';
    }
  },
  description: {
    type: String
  },
  age: {
    type: Number,
    required: function() {
      return this.role === 'Patient';
    }
  },
  bloodtype: {
    type: String
  },
  contact: {
    type: String,
    required: function() {
      return this.role === 'Patient';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  // Fix: Use a default expiration value if JWT_EXPIRE is invalid
  const jwtExpire = process.env.JWT_EXPIRE || '30d';
  
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpire }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', UserSchema);