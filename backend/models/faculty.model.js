// backend/models/faculty.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const facultySchema = new Schema({
  facultyId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  fullName: { type: String }, // Add this field
  email: { type: String },
  isProfileComplete: { type: Boolean, default: false },
});

// Pre-save middleware to set fullName
facultySchema.pre('save', function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

const Faculty = mongoose.model('Faculty', facultySchema);
module.exports = Faculty;