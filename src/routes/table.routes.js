const express = require('express');
const ctrl = require('../controllers/tableController');

const router = express.Router();

router.get('/qr/:qrToken', ctrl.getByQr);

module.exports = router;
