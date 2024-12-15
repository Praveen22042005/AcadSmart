const express = require('express');
const router = express.Router();
const Faculty = require('../models/faculty.model');
const Publication = require('../models/publication.model');
const SerpApi = require('google-search-results-nodejs');
require('dotenv').config();

// Initialize SerpApi client
const serpApi = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

// Convert serpApi.json to Promise
const getScholarData = (params) => {
  return new Promise((resolve, reject) => {
    serpApi.json(params, (data) => {
      if (data) resolve(data);
      else reject(new Error('Failed to fetch data from SerpApi'));
    });
  });
};

// Route to fetch publications by faculty email
router.get('/fetch/:email', async (req, res) => {
  try {
    const facultyEmail = req.params.email;
    const publications = await Publication.find({ facultyEmail });
    res.json({ success: true, publications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch publications',
    });
  }
});

// Route to fetch publications from Google Scholar
router.get('/fetch-scholar/:facultyId', async (req, res) => {
  try {
    const facultyId = req.params.facultyId;
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
      console.error(`Faculty with ID ${facultyId} not found.`);
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (!faculty.googleScholarLink) {
      console.error(`Google Scholar link not provided for faculty ID ${facultyId}.`);
      return res.status(400).json({ success: false, message: 'Google Scholar link not provided' });
    }

    // Extract Google Scholar user ID from the link
    let userId;
    try {
      const url = new URL(faculty.googleScholarLink);
      userId = url.searchParams.get('user');
      if (!userId) {
        throw new Error('User ID not found in Google Scholar link.');
      }
    } catch (urlError) {
      console.error(`Invalid Google Scholar link for faculty ID ${facultyId}:`, urlError.message);
      return res.status(400).json({ success: false, message: 'Invalid Google Scholar link' });
    }

    const params = {
      engine: 'google_scholar_author',
      author_id: userId,
      api_key: process.env.SERPAPI_KEY
    };

    // Fetch data from SerpApi
    const data = await getScholarData(params);
    
    if (!data || !data.articles) {
      console.error('No publications data returned from SerpApi:', data);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch publications from Google Scholar' 
      });
    }

    const publications = [];
    for (const pubData of data.articles) {
      // Check for existing publication
      const existing = await Publication.findOne({
        title: pubData.title,
        facultyEmail: faculty.email
      });

      if (!existing) {
        const publication = new Publication({
          facultyEmail: faculty.email,
          type: 'paper',
          title: pubData.title,
          authors: pubData.authors ? pubData.authors.split(',').map(a => a.trim()) : [],
          journal: pubData.publication || '',
          year: Number(pubData.year) || null,
          citations: pubData.cited_by ? Number(pubData.cited_by.value) : 0,
          url: pubData.link || '',
          abstract: pubData.snippet || ''
        });
        publications.push(publication);
      }
    }

    // Save new publications
    if (publications.length > 0) {
      await Publication.insertMany(publications);
      console.log(`Inserted ${publications.length} new publications for faculty ID: ${facultyId}`);
    } else {
      console.log('No new publications to insert.');
    }

    // Fetch all publications including newly added ones
    const allPublications = await Publication.find({ facultyEmail: faculty.email });
    res.json({ success: true, publications: allPublications });

  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to add a new publication
router.post('/add', async (req, res) => {
  try {
    const { facultyEmail, type, title, authors, journal, year, citations, url, abstract } = req.body;

    const publication = new Publication({
      facultyEmail,
      type,
      title,
      authors,
      journal,
      year: Number(year),
      citations: Number(citations) || 0,
      url,
      abstract,
    });

    await publication.save();
    res.json({ success: true, message: 'Publication added successfully' });
  } catch (error) {
    console.error('Error adding publication:', error);
    res.status(500).json({ success: false, message: 'Failed to add publication' });
  }
});

// Route to update a publication by ID
router.put('/update/:id', async (req, res) => {
  try {
    const updatedPublication = await Publication.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    if (!updatedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Publication updated successfully', 
      publication: updatedPublication 
    });
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update publication', 
      error: error.message 
    });
  }
});

// Route to delete a publication by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedPublication = await Publication.findByIdAndDelete(req.params.id);
    if (!deletedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    res.json({ success: true, message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete publication', 
      error: error.message 
    });
  }
});

module.exports = router;