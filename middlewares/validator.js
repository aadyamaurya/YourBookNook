const { Types } = require('mongoose');

const validateId = (req, res, next) => {
    const { itemId } = req.params;
    if (!Types.ObjectId.isValid(itemId)) {
        const err = new Error('Invalid Item id');
        err.status = 400;
        return next(err);
    }
    next();
};

module.exports = { validateId };