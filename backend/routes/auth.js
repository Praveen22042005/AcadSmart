// backend/routes/auth.js
const router = require('express').Router();
const Faculty = require('../models/faculty.model');
const bcrypt = require('bcryptjs');
const { generateFacultyId, generatePassword } = require('../utils/credentialGenerator');

// Register new faculty
router.post('/register', async (req, res) => {
  try {
    const facultyId = generateFacultyId();
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const faculty = new Faculty({
      facultyId,
      password: hashedPassword,
    });

    await faculty.save();
    
    res.json({ 
      success: true, 
      message: 'Registration successful',
      credentials: {
        facultyId,
        password: rawPassword
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    
    // Find faculty by ID
    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    res.json({ 
      success: true,
      faculty
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Complete profile route
router.post('/complete-profile', async (req, res) => {
  try {
    const { facultyId, firstName, lastName, email, googleScholarLink } = req.body; // Include googleScholarLink
    const faculty = await Faculty.findOneAndUpdate(
      { facultyId },
      { 
        firstName, 
        lastName, 
        email, 
        googleScholarLink,
        isProfileComplete: true 
      },
      { new: true }
    );
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;