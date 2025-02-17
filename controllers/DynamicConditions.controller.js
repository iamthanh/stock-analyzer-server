import path from "path";
import { get, isNumber, result, set, sum, values } from "lodash";
import { getSymbolDataByType } from "../../stock-probability-analyzer/dynamicConditions/helper";
import { findTrendsForSymbol } from "../../stock-probability-analyzer/ConditionOccurrences/helpers";
import { DAILY } from "../../stock-data-collector/technicals/constants";
import { getReportFilesFromFolder } from "../../stock-probability-analyzer/helpers/csv";
import { reportPaths } from "../../stock-probability-analyzer/config";
import { readJSONFile } from "../../stock-probability-analyzer/helpers/files";
import { getConditionsConfigsV2 } from "../../stock-probability-analyzer/conditionsConfig/v2";
import { CONDITION_RESULTS_TYPE_DYNAMIC_NUMBER, CONDITION_RESULTS_TYPE_DYNAMIC_NUMBER_WITH_PREFIX, CONDITION_RESULTS_TYPE_STATIC } from "../../stock-probability-analyzer/conditionsConfig/constants";
import { NO_DATA } from "../../stock-probability-analyzer/constants";

class DynamicConditionsController {
  static async getAllByTrendResults(req, res) {
    let reportFolderPath = path.join(__dirname, "../", "../", "../", "reports", reportPaths.dynamicConditionFrequencies);
    let filesFound = await getReportFilesFromFolder(reportFolderPath);
    if (filesFound) {
      let processData = {};
      for (let file of filesFound) {
        let data = await readJSONFile(path.join(reportFolderPath, file));

        for (let periodsBack of Object.keys(data)) {
          for (let conditionName of Object.keys(data[periodsBack])) {
            let key = `${periodsBack}-${file.split(".")[0]}`.replaceAll("-periods-back", "").replaceAll("maxLength_", "").replaceAll("-minPercent", "");
            set(processData, [conditionName, key], data[periodsBack][conditionName]);
          }
        }
      }

      let seriesDataByCondition = {};
      for (let conditionName of Object.keys(processData)) {
        const conditionConfigFound = Object.keys(getConditionsConfigsV2).find((name) => conditionName.includes(name));

        if (conditionConfigFound && getConditionsConfigsV2[conditionConfigFound]) {
          const resultType = getConditionsConfigsV2[conditionConfigFound].resultType;

          if (resultType === CONDITION_RESULTS_TYPE_STATIC) {
            let allPossibleValues = getAllPossibleResultValues(processData[conditionName]);
            seriesDataByCondition = processStaticCondition(processData, conditionName, allPossibleValues, seriesDataByCondition);
          } else if (resultType === CONDITION_RESULTS_TYPE_DYNAMIC_NUMBER) {
            seriesDataByCondition = processDynamicNumberCondition(processData, conditionName, seriesDataByCondition);
          } else if (resultType === CONDITION_RESULTS_TYPE_DYNAMIC_NUMBER_WITH_PREFIX) {
            let allPossibleValues = getAllPossibleResultValues(processData[conditionName]);
            seriesDataByCondition = processStaticCondition(processData, conditionName, allPossibleValues, seriesDataByCondition);
            // seriesDataByCondition = processDynamicNumberWithPrefixCondition(processData, conditionName, seriesDataByCondition);
          }
        }
      }

      res.json({ status: "success", data: seriesDataByCondition });
      return;
    }

    res.json({ status: "success", data: [] });
  }
}

const processStaticCondition = (data, conditionName, allPossibleValues, seriesDataByCondition) => {
  let sorted = sortConfigKeys(data[conditionName]);

  set(seriesDataByCondition, [conditionName, "seriesData"], generateStackSeriesDataForStaticCondition(data, conditionName, allPossibleValues, sorted));
  set(seriesDataByCondition, [conditionName, "xAxisKeys"], sorted);

  return seriesDataByCondition;
};

const processDynamicNumberCondition = (processData, conditionName, seriesDataByCondition) => {
  let data = {};
  for (let configKey of Object.keys(processData[conditionName])) {
    let ranges = splitToNChunks(
      Object.keys(processData[conditionName][configKey]).sort((a, b) => parseInt(a.replaceAll("_", "")) - parseInt(b.replaceAll("_", ""))),
      5
    );

    for (let range of ranges) {
      let key = `${range[0]}-${range[range.length - 1]}`.replaceAll("_", "");
      let sum = 0;
      for (let rangeKey of range) {
        sum += processData[conditionName][configKey][rangeKey];
      }
      set(data, [conditionName, configKey, key], sum);
    }
  }

  return processStaticCondition(data, conditionName, getAllPossibleResultValues(data[conditionName]), seriesDataByCondition);
};

const processDynamicNumberWithPrefixCondition = (processData, conditionName, seriesDataByCondition) => {
  let data = {};
  for (let configKey of Object.keys(processData[conditionName])) {
    let prefixGroup = {};
    for (let result of Object.keys(processData[conditionName][configKey])) {
      if (!result.includes(NO_DATA)) {
        let split = result.split("::");
        if (split.length > 0) {
          set(prefixGroup, [split[0], `_${split[1]}`], processData[conditionName][configKey][result]);
        }
      }
    }

    let sortedGroups = {};
    for (let prefix of Object.keys(prefixGroup)) {
      set(
        sortedGroups,
        [prefix],
        splitToNChunks(
          Object.keys(prefixGroup[prefix]).sort((a, b) => parseInt(a.replaceAll("_", "")) - parseInt(b.replaceAll("_", ""))),
          4
        )
      );
    }

    for (let prefix of Object.keys(sortedGroups)) {
      for (let range of sortedGroups[prefix]) {
        let key = `${prefix}-${range[0]}-${range[range.length - 1]}`.replaceAll("_", "");
        let sum = 0;
        for (let rangeKey of range) {
          sum += processData[conditionName][configKey][`${prefix}::${rangeKey.replaceAll("_", "")}`];
        }
        set(data, [conditionName, configKey, key], sum);
      }
    }
  }

  return processStaticCondition(data, conditionName, getAllPossibleResultValues(data[conditionName]), seriesDataByCondition);
};

function splitToNChunks(array, n) {
  let result = [];
  for (let i = n; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)));
  }
  return result;
}

const getAllPossibleResultValues = (data) => {
  let allPossibleValues = new Set();
  for (const configKey of Object.keys(data)) {
    Object.keys(data[configKey]).forEach(allPossibleValues.add, allPossibleValues);
  }
  return [...allPossibleValues];
};

const generateStackSeriesDataForStaticCondition = (data, conditionName, allPossibleValues, xAxisKeys) => {
  return (allPossibleValues || []).map((valueType) => ({
    name: valueType,
    type: "bar",
    stack: "total",
    data: (xAxisKeys || []).map((key) => {
      if (data[conditionName][key][valueType]) {
        return data[conditionName][key][valueType];
      } else {
        return "-";
      }
    }),
  }));
};

const sortConfigKeys = (dataByConfigKeys) => {
  let configKeys = Object.keys(dataByConfigKeys);
  return configKeys.sort((a, b) => Math.max(...Object.values(dataByConfigKeys[b])) - Math.max(...Object.values(dataByConfigKeys[a])));
};

module.exports = DynamicConditionsController;
