// backend/models/faculty.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const facultySchema = new Schema({
  facultyId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String },
  email: { type: String },
  profilePhoto: { 
    type: String,
    default: 'default-avatar.png'
  },
  isProfileComplete: { type: Boolean, default: false },
  publicProfileToken: { type: String, unique: true, sparse: true }, // New field
});

// Pre-save middleware to set fullName
facultySchema.pre('save', function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

const Faculty = mongoose.model('Faculty', facultySchema);
module.exports = Faculty;