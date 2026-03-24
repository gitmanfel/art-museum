const db = require('../db');

// Get all exhibitions
exports.getAllExhibitions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exhibitions ORDER BY start_date DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    res.status(500).json({ message: 'Server error fetching exhibitions' });
  }
};

// Get a single exhibition by ID
exports.getExhibitionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM exhibitions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exhibition not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching exhibition ${id}:`, error);
    res.status(500).json({ message: 'Server error fetching exhibition' });
  }
};

// Get the featured exhibition
exports.getFeaturedExhibition = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exhibitions WHERE is_featured = true LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No featured exhibition found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching featured exhibition:', error);
    res.status(500).json({ message: 'Server error fetching featured exhibition' });
  }
};

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM collections ORDER BY title ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Server error fetching collections' });
  }
};
