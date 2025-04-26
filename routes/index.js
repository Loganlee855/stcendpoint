const express = require("express");
require('dotenv').config();

const router = express.Router();

const callbackRouter = require("./v1");
const IntegrationService = require("./integrationservice");
const integrationController = require('../controllers/integrationController');

function checkDomain() {
  return (req, res, next) => {
    const host = req.get("Host");

    if (host != process.env.LAUNCH_URL) {
      return next();
    } else {
      return res.status(404).render("error/404");
    }
  };
}

router.use("/v1/api/seamless",checkDomain(), callbackRouter);
router.use("/IntegrationService/http",checkDomain(), IntegrationService);
  
router.post('/api/provider_check',checkDomain(), integrationController.providerList);
router.post('/api/gamelist',checkDomain(), integrationController.gameList);

router.get('/games/:provider_code/launch', integrationController.gamesLaunch);
// router.get('/games', integrationController.games);
// router.get('/image/copy', integrationController.copyHtml);


module.exports = router;