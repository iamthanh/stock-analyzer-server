import { isNumber } from "lodash";
import { getSymbolDataByType } from "../../stock-probability-analyzer/dynamicConditions/helper";
import { findTrendsForSymbol } from "../../stock-probability-analyzer/ConditionOccurrences/helpers";
import { DAILY } from "../../stock-data-collector/technicals/constants";

class DataToolsController {
  static async getTrendDetectionData(req, res) {
    const { symbol } = req.params;
    const { maxPeriods = 7, minPercentChange = 5 } = req.query;

    if (symbol) {
      let dailyData = await getSymbolDataByType(DAILY, symbol);
      let trendsFound = getDataForTrendDetection(dailyData, maxPeriods, minPercentChange);

      if ("limit" in req.query && isNumber(parseInt(req.query.limit))) {
        trendsFound = trendsFound.slice(trendsFound.length - parseInt(req.query.limit));
      }

      res.json({ status: "success", data: trendsFound });
    }
  }
}

const getDataForTrendDetection = (symbolData, maxPeriods, minPercentChange) => {
  return findTrendsForSymbol(symbolData, maxPeriods, minPercentChange);
};

module.exports = DataToolsController;
