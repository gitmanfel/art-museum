const express = require('express');
const router = express.Router();
const exhibitionController = require('../controllers/exhibitionController');

router.get('/', exhibitionController.getAllExhibitions);
router.get('/featured', exhibitionController.getFeaturedExhibition);
router.get('/:id', exhibitionController.getExhibitionById);
router.get('/data/collections', exhibitionController.getAllCollections); // Placed here for simplicity, or could be a separate route file

module.exports = router;
