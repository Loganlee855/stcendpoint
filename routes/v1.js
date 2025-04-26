const express = require('express');
const router = express.Router();
const seamlessController = require('../controllers/seamlessController');
const withdrawController = require('../controllers/withdrawController');
const depositController = require('../controllers/depositController');
const pushbetController = require('../controllers/pushbetController');

router.post('/balance', seamlessController.getBalance);
router.post('/withdraw', withdrawController.Withdraw);
router.post('/deposit', depositController.deposit);
router.post('/pushbetdata', pushbetController.pushbet);

module.exports = router;
