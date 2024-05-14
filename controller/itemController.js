const itemModel = require('../models/itemModel');
const userModel = require('../models/userModel');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Offer = require('../models/offerModel');

// Multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage }).single('image');

exports.index = async (req, res, next) => {
    try {
        let items = await itemModel.find().sort({ price: 1 });
        res.render('./item/items', { items });
    } catch (error) {
        next(error);
    }
};

exports.renderNewForm = (req, res) => {
    res.render('./item/new');
};

exports.createItem = async (req, res, next) => {
    try {
        // Upload image using multer
        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                console.error(err);
                req.flash('error', 'Error uploading image.');
                return res.status(500).send('Error uploading image.');
            } else if (err) {
                console.error(err);
                req.flash('error', 'Error uploading image.');
                return res.status(500).send('Error uploading image.');
            }

            if (!req.file) {
                req.flash('error', 'No file uploaded.');
                return res.status(400).send('No file uploaded.');
            }

            const { title, condition, price, details } = req.body;
            const filename = path.basename(req.file.path);
            
            // Get logged-in user's ID
            const userId = req.session.user;

            // Find the logged-in user using the User model
            const user = await userModel.findById(userId).catch(err => {
                console.error(err);
                req.flash('error', 'Error finding user.');
                return res.status(500).send('Error finding user.');
            });
            
            if (!user) {
                req.flash('error', 'User not found.');
                return res.status(404).send('User not found.');
            }

            const newItem = new itemModel({
                title,
                condition,
                price,
                details,
                image: filename,
                author: userId, // Associate with user
                sellerName: `${user.firstName} ${user.lastName}` // Add seller's name
            });
            await newItem.save();
            req.flash('success', 'Item created successfully');
            res.redirect('/items');
        });
    } catch (error) {
        next(error);
    }
};

exports.show = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            const err = new Error('Invalid item id: ' + itemId);
            err.status = 400;
            throw err;
        }
        // Fetch the item
        const item = await itemModel.findById(itemId);
        if (!item) {
            const err = new Error('Cannot find an item with id ' + id);
            err.status = 404;
            throw err;
        }
        // Fetch the highest offer for the item
        const highestOffer = await Offer.findOne({ item: itemId }).sort({ amount: -1 }).limit(1);

        // Render the item detail page with the item and highest offer data
        res.render('./item/item', { item, highestOffer });
    } catch (error) {
        next(error);
    }
};



exports.renderEditForm = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            const err = new Error('Invalid item id: ' + itemId);
            err.status = 400;
            throw err;
        }
        const item = await itemModel.findById(itemId);
        if (item) {
            res.render('./item/edit', { item });
        } else {
            const err = new Error('Cannot find an item with id ' + itemId);
            err.status = 404;
            throw err;
        }
    } catch (error) {
        next(error);
    }
};

exports.updateItem = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            const err = new Error('Invalid item id: ' + itemId);
            err.status = 400;
            throw err;
        }
        const { title, condition, price, details } = req.body;
        const updatedItem = {
            title,
            condition,
            price,
            details
        };
        const result = await itemModel.findByIdAndUpdate(itemId, updatedItem, { new: true });
        if (result) {
            req.flash('success', 'Item updated successfully');
            res.redirect('/items/' + itemId);
        } else {
            const err = new Error('Cannot find an item with id ' + itemId);
            err.status = 404;
            throw err;
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteItem = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            const err = new Error('Invalid item id');
            err.status = 400;
            throw err;
        }
        // Delete the item
        const result = await itemModel.findByIdAndDelete(itemId);
        if (result) {
            // Optionally, delete or update offers associated with the item
            await Offer.deleteMany({ item: itemId });
            req.flash('success', 'Item and associated offers deleted successfully');
            res.redirect('/items/');
        } else {
            const err = new Error('Cannot find an item with id ' + itemId);
            err.status = 404;
            throw err;
        }
    } catch (error) {
        next(error);
    }
};

exports.searchItems = async (req, res, next) => {
    try {
        const searchTerm = req.query.q.toLowerCase(); 
        const items = await itemModel.find({ $or: [{ title: { $regex: searchTerm, $options: 'i' }}, { details: { $regex: searchTerm, $options: 'i' }}]});
        res.render('./item/items', { items });
    } catch (error) {
        next(error);
    }
};






