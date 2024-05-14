// offerRoutes.js
const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');
const { isLoggedIn, isAuthor } = require('../middlewares/auth');

// Route for making an offer on an item
router.post('/:itemId', isLoggedIn, offerController.makeOffer);

// Route for viewing offers on a specific item
router.get('/:itemId/offers', isLoggedIn, isAuthor, offerController.viewItemOffers);

// Route for accepting an offer
router.post('/:itemId/offers/:offerId/accept', isLoggedIn, isAuthor, offerController.acceptOffer);

module.exports = router;
