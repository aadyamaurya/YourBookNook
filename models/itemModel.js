// itemModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    title: { type: String, required: true },
    condition: { type: String, enum: ['New', 'Like New', 'Good', 'Acceptable', 'Poor'], required: true },
    price: { type: Number, min: 0.01, required: true },
    details: { type: String, required: true },
    image: { type: String, required: true },
    totalOffers: { type: Number, default: 0 },
    highestOffer: { type: Number, default: 0 },
    active: { type: Boolean, default: true }, // Add active field
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    sellerName: { type: String } 
}, { collection: 'Items' });

const itemModel = mongoose.model('Item', itemSchema);

module.exports = itemModel;
