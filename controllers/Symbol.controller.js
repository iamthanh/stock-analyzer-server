import path from "path";
import { isNumber } from "lodash";
import { DATA_TYPE_DAILY } from "../../stock-data-collector/helper/constants";
import { getSymbolDataByType } from "../../stock-probability-analyzer/dynamicConditions/helper";
import { getStocksFromFolder } from "../../stock-probability-analyzer/helpers/stockData";
import config from "../../stock-probability-analyzer/config";
import { getTickers } from "../../stock-data-collector/api/tickers";
import { DATA_TYPE_FOLDER_MAPPING } from "../../stock-probability-analyzer/constants";

class SymbolController {
  static async getData(req, res) {
    try {
      const { symbol, dataType } = req.params;
      if (symbol && dataType) {
        let data = await getSymbolDataByType(dataType, symbol, req.query);

        if ("limit" in req.query && isNumber(parseInt(req.query.limit))) {
          let dataSize = Object.keys(data).length;
          let limitedData = {};

          Object.keys(data)
            .sort((a, b) => a.localeCompare(b, "en", { ignorePunctuation: true }))
            .slice(dataSize - parseInt(req.query.limit))
            .forEach((date) => (limitedData[date] = data[date]));

          data = limitedData;
        }

        if (data) {
          res.json({ status: "success", data });
        } else {
          res.json({ status: "error", message: "No data found" });
        }
      }
    } catch (err) {}
  }
  static async getListData(req, res) {
    try {
      let _symbolsPath = path.join(__dirname, "../../../", config.stockData.rootFolder, config.stockData.currentVersionFolder, DATA_TYPE_FOLDER_MAPPING[DATA_TYPE_DAILY]);
      let symbols = await getStocksFromFolder(_symbolsPath, false, false);

      const allTickersDetails = [...(await getTickers("XNYS")), ...(await getTickers("XNAS"))].filter((symbol) => symbols.includes(symbol.ticker));

      res.json({ status: "success", data: allTickersDetails });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = SymbolController;
