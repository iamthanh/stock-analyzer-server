# Introduction

Handles api requests to get data for analyzing stocks. This serves as the primary service to get displayable data for the stock-analyzer-ui system

### Endpoints

##### GET /api/data/symbol/:symbol/:dataType
This gets the locally stored data of symbols from the backend
```
Params
symbol: string, this the ticker symbol
dataType: string, data type to be returned, (eg, Daily, EMA, MACD,... )

Returns
{
  data: { ... data for the symbol grouped by date "YYYY-MM-DD }
  status: string, success or error
}
```

##### GET /api/data/symbol/list
Gets all of the known symbols locally stored in backend
```
Params
None

Returns
{
  data: string[], an array of strings (symbols)
  status: string, success or error
}
```

##### GET /api/data-tools/trend-detection/:symbol?maxPeriods=&minPercentChange=
Gets trends detected using user defined configuration
```
Params
symbol: string, this the ticker symbol
maxPeriods: string, the number of max periods allowed for calculating trend
minPercentChange: string, the number of minimum upward movement to be counted as trend

Returns
{
  data: [
    "start": number,
		"end": number,
		"startDate": string,
		"endDate": string,
		"percentChange": number,
		"periods": number
  ],
  status: string, success or error
}
```

##### GET /api/dynamic-conditions/results-by-trends
Anaylzes known reports generated from using trends found and dynamic conditions
```
Params
None

Returns
{
  data: { ... results grouped by type of conditions }
  status: string, success or error
}
```
