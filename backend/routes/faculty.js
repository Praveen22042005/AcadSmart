// Filepath: /backend/routes/faculty.js
const router = require('express').Router();
const Faculty = require('../models/faculty.model');
const Publication = require('../models/publication.model');
const crypto = require('crypto');

// Search faculty by name
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;

    // Create a regex for case-insensitive search
    const nameRegex = new RegExp(name, 'i');

    // Search for faculty where firstName, lastName, or fullName match the query
    const faculty = await Faculty.findOne({
      $or: [
        { firstName: nameRegex },
        { lastName: nameRegex },
        { fullName: nameRegex },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: nameRegex,
            },
          },
        },
      ],
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Fetch publications by facultyEmail instead of authors
    const publications = await Publication.find({ facultyEmail: faculty.email });

    res.json({ success: true, faculty, publications });
  } catch (error) {
    console.error('Error searching faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search faculty',
      error: error.message,
    });
  }
});

// Get faculty names for suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { query } = req.query;
    const facultyNames = await Faculty.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    }).select('firstName lastName').limit(10);
    res.json({ success: true, facultyNames });
  } catch (error) {
    console.error("Error fetching faculty suggestions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch faculty suggestions", error: error.message });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (req.body.profilePhoto) {
      faculty.profilePhoto = req.body.profilePhoto;
    }

    const updatedFaculty = await faculty.save();
    res.json({ success: true, faculty: updatedFaculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Route to generate public profile URL
router.post('/generate-profile-url', async (req, res) => {
  try {
    const { facultyId } = req.body;
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Generate a unique token
    const token = crypto.randomBytes(16).toString('hex');
    faculty.publicProfileToken = token;
    await faculty.save();

    const profileURL = `${process.env.FRONTEND_URL}/public-profile/${token}`;

    res.json({ success: true, profileURL });
  } catch (error) {
    console.error('Error generating profile URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate profile URL' });
  }
});

// Route to fetch publications via publicProfileToken
router.get('/public-profile/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const faculty = await Faculty.findOne({ publicProfileToken: token });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Invalid profile URL' });
    }

    const publications = await Publication.find({ facultyEmail: faculty.email });

    res.json({ success: true, faculty, publications });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch public profile' });
  }
});

module.exports = router;