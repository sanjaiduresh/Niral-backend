// File: models/Hospital.js
import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hospital name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  adminPassword: {
    type: String,
    required: [true, 'Please add an admin password'],
    select: false
  },
  doctorPassword: {
    type: String,
    required: [true, 'Please add a doctor password'],
    select: false
  },
  receptionistPassword: {
    type: String,
    required: [true, 'Please add a receptionist password'],
    select: false
  },
  coordinates: {
    type: [Number],
    required: [true, 'Please add coordinates'],
    validate: {
      validator: function(v) {
        return v.length === 2;
      },
      message: 'Coordinates must contain latitude and longitude values'
    }
  },
  services: {
    type: [String],
    required: [true, 'Please add services offered']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Hospital', HospitalSchema);
