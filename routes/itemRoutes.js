const express = require('express');
const itemController = require('../controller/itemController');
const { isLoggedIn, isAuthor } = require('../middlewares/auth');
const { validateId } = require('../middlewares/validator');

const router = express.Router();

// Routes for items

router.get('/', itemController.index);
router.get('/new', isLoggedIn, itemController.renderNewForm);
router.post('/', isLoggedIn, itemController.createItem);
router.get('/search', itemController.searchItems);
router.get('/:itemId', validateId, itemController.show);
router.get('/:itemId/edit', isLoggedIn, isAuthor, validateId, itemController.renderEditForm);
router.put('/:itemId', isLoggedIn, isAuthor, validateId, itemController.updateItem);
router.delete('/:itemId', isLoggedIn, isAuthor, validateId, itemController.deleteItem);
module.exports = router;
