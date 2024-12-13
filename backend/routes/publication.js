const router = require('express').Router();
const Publication = require('../models/publication.model');
const axios = require('axios');

// Get publications by email
router.get('/fetch/:email', async (req, res) => {
  try {
    const facultyEmail = req.params.email;
    
    // First check local database
    let localPublications = await Publication.find({ authors: facultyEmail });

    // Fetch from Semantic Scholar API
    try {
      // First get author ID using author search
      const authorSearchUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(facultyEmail)}`;
      const authorResponse = await axios.get(authorSearchUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (authorResponse.data && authorResponse.data.data && authorResponse.data.data.length > 0) {
        const authorId = authorResponse.data.data[0].authorId;
        
        // Then fetch author's papers using the author ID
        const papersUrl = `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?fields=title,authors,year,venue,citationCount,url,abstract`;
        const papersResponse = await axios.get(papersUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (papersResponse.data && papersResponse.data.data) {
          const scholarPublications = papersResponse.data.data.map(paper => ({
            title: paper.title,
            authors: paper.authors.map(author => author.name),
            journal: paper.venue,
            year: paper.year,
            citations: paper.citationCount || 0,
            url: paper.url,
            abstract: paper.abstract
          }));

          // Combine and deduplicate publications
          const allPublications = [...localPublications, ...scholarPublications];
          const uniquePublications = Array.from(new Map(allPublications.map(pub => [pub.title, pub])).values());

          return res.json({
            success: true,
            publications: uniquePublications,
            stats: {
              totalPublications: uniquePublications.length,
              totalCitations: uniquePublications.reduce((sum, pub) => sum + (pub.citations || 0), 0)
            }
          });
        }
      }

      // If no Semantic Scholar data found, return local publications
      return res.json({
        success: true,
        publications: localPublications
      });

    } catch (apiError) {
      console.error("Scholar API error:", apiError);
      // Return local publications if API fails
      return res.json({
        success: true,
        publications: localPublications
      });
    }
  } catch (error) {
    console.error("Error fetching publications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch publications",
      error: error.message
    });
  }
});

// Add new publication
router.post('/add', async (req, res) => {
  try {
    const { title, authors, journal, year, citations, url, abstract, type } = req.body;
    
    const newPublication = new Publication({
      title,
      authors, // Use authors from request body
      journal,
      year: Number(year),
      citations: Number(citations) || 0,
      url,
      abstract,
      type
    });

    await newPublication.save();
    res.json({ success: true, message: 'Publication added successfully' });
  } catch (error) {
    console.error("Error adding publication:", error);
    res.status(500).json({ success: false, message: "Failed to add publication" });
  }
});

// Update a publication by ID
router.put('/update/:id', async (req, res) => {
  try {
    const updatedPublication = await Publication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return the updated document
    );
    if (!updatedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    res.json({ success: true, message: 'Publication updated successfully', publication: updatedPublication });
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ success: false, message: 'Failed to update publication', error: error.message });
  }
});

// Delete a publication by ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedPublication = await Publication.findByIdAndDelete(req.params.id);
    if (!deletedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    res.json({ success: true, message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ success: false, message: 'Failed to delete publication', error: error.message });
  }
});

module.exports = router;