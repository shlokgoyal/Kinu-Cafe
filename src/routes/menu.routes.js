const express = require('express');
const ctrl = require('../controllers/menuController');

const router = express.Router();

router.get('/categories', ctrl.listCategories);
router.get('/items', ctrl.listItems);
router.get('/items/popular', ctrl.popularItems);
router.get('/items/:slug', ctrl.getItemBySlug);

module.exports = router;
