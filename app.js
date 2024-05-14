const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const crypto = require('crypto');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const offerRoutes = require('./routes/offerRoutes'); // Import offerRoutes

const app = express();

// Configure app
const port = 3000;
const host = 'localhost';
app.set('view engine', 'ejs');

// Generate session secret
const sessionSecret = crypto.randomBytes(64).toString('hex');

// MongoDB Atlas
const mongoURI = 'mongodb+srv://amaurya2:ZP9AZDIK9fy8tPwi@yourbooknook.ujfnsmv.mongodb.net/project3';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// Mount middleware
app.use(
    session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: mongoURI }),
        cookie: { maxAge: 60 * 60 * 1000 }
    })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));
app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
});

// Set up routes
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/items', itemRoutes);
app.use('/users', userRoutes);
app.use('/items', offerRoutes); // Mount offer routes

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.message !== 'The server cannot locate ' + req.url) {
        console.error(err.stack);
        if (!err.status) {
            err.status = 500;
            err.message = "Internal Server Error";
        }

        // Check if the error is a Mongoose validation error
        if (err.name === 'ValidationError') {
            req.flash('error', err.message);
            return res.redirect('back');
        } else {
            res.status(err.status);
            res.render('error', { error: err });
        }
    } else {
        next(err);
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at port ${port}`);
});
