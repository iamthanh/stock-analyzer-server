const express = require("express");
const router = express.Router();
const SymbolController = require("../../controllers/Symbol.controller");

router.get("/:symbol/:dataType", SymbolController.getData);
router.get("/list", SymbolController.getListData);

module.exports = router;
