// backend/routes/faculty.js
const router = require('express').Router();
const Faculty = require('../models/faculty.model');
const Publication = require('../models/publication.model');

// Search faculty by name
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;

    // Create a regex for case-insensitive search
    const nameRegex = new RegExp(name, 'i');

    // Search for faculty where firstName and lastName match the query
    const faculty = await Faculty.findOne({
      $or: [
        { firstName: nameRegex },
        { lastName: nameRegex },
        { fullName: nameRegex }, // If you have a fullName field
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

    // Fetch publications by faculty email
    const publications = await Publication.find({ authors: faculty.email });

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

module.exports = router;