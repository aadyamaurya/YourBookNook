// offerController.js

const userModel = require('../models/userModel');
const itemModel = require('../models/itemModel');
const Offer = require('../models/offerModel');

exports.makeOffer = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const itemId = req.params.itemId;
        const { amount } = req.body;

        // Check if amount is a positive number
        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).send('Invalid offer amount. Please provide a positive number.');
        }

        // Check if the user is trying to make an offer on their own item
        const item = await itemModel.findOne({ _id: itemId }).populate('author');
        if (!item || item.author._id.toString() === userId) {
            return res.status(401).send('401 Error: You cannot make an offer on your own item.');
        }

        // Create and save the offer
        const offer = new Offer({
            user: userId,
            item: itemId,
            amount,
        });
        await offer.save();

        // Increment total offers for the item
        await itemModel.findByIdAndUpdate(itemId, { $inc: { totalOffers: 1 } });

        // Update highest offer if the new amount is higher
        await itemModel.findByIdAndUpdate(
            itemId,
            { $max: { highestOffer: amount } },
            { new: true }
        );

        // Store a success message using req.flash
        req.flash('success', 'Your offer has been successfully made.');

        // Redirect the user back to the item details page
        res.redirect(`/items/${itemId}`);

    } catch (error) {
        next(error);
    }
};


//the offers a user received (on offers.ejs)
exports.viewItemOffers = async (req, res, next) => {
    try {
        const itemId = req.params.itemId; // Get the itemId from the request parameters

        // Fetch the item associated with the itemId
        const item = await itemModel.findById(itemId);

        if (!item) {
            return res.status(404).send('Item not found.');
        }

        // Retrieve offers made on the specific item and populate both user and item fields
        const offers = await Offer.find({ item: itemId }).populate({
            path: 'user', // Populate the user who made the offer
            select: 'firstName lastName' // Select only the firstName and lastName fields
        }).populate({
            path: 'item', // Populate the item for which the offer was made
            select: 'title' // Select only the title field of the item
        });

        res.render('./offer/offers', { offers, item }); // Render the offers.ejs page with the offers and item
    } catch (error) {
        next(error);
    }
};


exports.acceptOffer = async (req, res, next) => {
    try {
        console.log("Accept offer request received. Params:", req.params); // Log request parameters
        const userId = req.session.user;
        const itemId = req.params.itemId;
        const offerId = req.params.offerId;

        // Update the status of the accepted offer to 'accepted'
        console.log("Attempting to accept offer. Item ID:", itemId, "Offer ID:", offerId);
        const offer = await Offer.findOneAndUpdate({ _id: offerId, item: itemId }, { status: 'accepted' }, { new: true });
        if (!offer) {
            return res.status(404).send('Offer not found or not associated with this item.');
        }

        // Deactivate the item associated with the accepted offer
        const updatedItem = await itemModel.findByIdAndUpdate(itemId, { active: false }, { new: true });
        if (!updatedItem) {
            return res.status(500).send('Failed to update item status.');
        }

        // Reject all other offers for the same item
        const result = await Offer.updateMany({ item: itemId, _id: { $ne: offerId } }, { status: 'rejected' });
        if (result.nModified === 0) {
            return res.status(500).send('Failed to reject other offers.');
        }

        // Redirect the user back to the viewItemOffers route
        res.redirect(`/items/${itemId}/offers`);
    } catch (error) {
        console.error('Error accepting offer:', error);
        next(error);
    }
};
