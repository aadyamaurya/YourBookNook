const itemModel = require('../models/itemModel');

exports.isGuest = (req, res, next) => {
    if (!req.session.user) {
        return next();
    } else {
        req.flash('error', 'You are logged in already');
        return res.redirect('/users/profile');
    }
};

exports.isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        req.flash('error', 'You need to login first');
        return res.redirect('/users/login');
    }
};

exports.isAuthor = (req, res, next) => {
    let itemId = req.params.itemId; // Corrected to use itemId

    itemModel.findById(itemId)
        .then(item => {
            if (item) {
                if (item.author == req.session.user) {
                    return next();
                } else {
                    let err = new Error('unauthorized to access the resource');
                    err.status = 401;
                    return next(err);
                }
            } else {
                let err = new Error('Cannot find an item with id ' + itemId); // Corrected the error message
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};


