const express = require("express");
const router = express.Router();
const DataToolsController = require("../../controllers/DataTools.controller");

router.get("/trend-detection/:symbol", DataToolsController.getTrendDetectionData);

module.exports = router;
