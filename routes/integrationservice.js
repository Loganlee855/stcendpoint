const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const validate = require("../middlewares/validate");

const memberSchema = require("../validations/member");
router.post('/api/account/create',validate(memberSchema.create), memberController.create);
router.post('/api/balance/current',validate(memberSchema.create), memberController.balance);
router.post('/api/balance/transfer',validate(memberSchema.transfer), memberController.transfer);
router.post('/api/balance/withdraw',validate(memberSchema.transfer), memberController.withdraw);


router.post('/api/games/getCasinoProvider',validate(memberSchema.casinoprovider), memberController.casinoprovider);
router.post('/api/games/getCasinoGames',validate(memberSchema.casinogame), memberController.casinogame);
router.post('/api/games/GameLaunch',validate(memberSchema.launchGame), memberController.GetGameLaunch);

// HISTORY
router.post('/HistoryAPI/GetGameRounds',validate(memberSchema.GetGameRounds), memberController.GetGameRounds);
router.post('/HistoryAPI/GetGameRounds/:wager_code/details',validate(memberSchema.GetGameRoundsDetails), memberController.GetGameRoundsDetails);

module.exports = router;