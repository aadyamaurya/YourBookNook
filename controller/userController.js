const userModel = require('../models/userModel');
const ItemModel = require('../models/itemModel');
const Offer = require('../models/offerModel');
const validator = require('validator');

exports.new = (req, res) => {
    return res.render('user/new');
};

exports.create = (req, res, next) => {
    // Trim and escape inputs
    req.body.firstName = validator.escape(req.body.firstName.trim());
    req.body.lastName = validator.escape(req.body.lastName.trim());
    req.body.email = validator.normalizeEmail(req.body.email.trim());
    // Ensure password meets the length requirements
    if (req.body.password.length < 8 || req.body.password.length > 64) {
        req.flash('error', 'Password must be between 8 and 64 characters');
        return res.redirect('/users/new');
    }

    let user = new userModel(req.body);
    user.save()
        .then(user => {
            req.flash('success', 'User account created successfully');
            res.redirect('/users/login');
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                const errors = Object.values(err.errors).map(error => error.message);
                req.flash('error', errors);
                return res.redirect('/users/new');
            } else if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
                req.flash('error', 'Email address already in use');
                return res.redirect('/users/new');
            } else {
                next(err);
            }
        });
};


exports.getUserLogin = (req, res) => {
    return res.render('user/login');
};

exports.login = (req, res, next) => {
    // Trim and normalize email
    let email = validator.normalizeEmail(req.body.email.trim());
    let password = req.body.password;

    userModel.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Wrong email address');
                return res.redirect('/users/login');
            }
            user.comparePassword(password)
                .then(result => {
                    if (result) {
                        req.session.user = user._id;
                        req.flash('success', 'You have successfully logged in');
                        res.redirect('/users/profile');
                    } else {
                        req.flash('error', 'Wrong password');
                        res.redirect('/users/login');
                    }
                })
                .catch(next); 
        })
        .catch(next); 
};



exports.profile = async (req, res, next) => {
    try {
        let id = req.session.user;
        if (!id) {
            req.flash('error', 'User not logged in.');
            return res.redirect('/users/login');
        }

        const [user, items, offers] = await Promise.all([
            userModel.findById(id),
            ItemModel.find({ author: id }),
            Offer.find({ user: id }).populate('item')
        ]);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/login');
        }

        res.render('user/profile', { user, items, offers }); // Pass offers to the view
    } catch (error) {
        next(error); 
    }
};

exports.logout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            next(err); 
        } else {
            return res.redirect('/users/login');
        }
    });
};
