// File: models/Department.js
import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a department name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for unique department names within a hospital
DepartmentSchema.index({ name: 1, hospitalId: 1 }, { unique: true });

export default mongoose.model('Department', DepartmentSchema);
