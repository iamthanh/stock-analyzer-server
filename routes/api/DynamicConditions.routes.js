const express = require("express");
const router = express.Router();
const ConditionResultsByTrendsController = require("../../controllers/DynamicConditions.controller");

router.get("/results-by-trends", ConditionResultsByTrendsController.getAllByTrendResults);

module.exports = router;
