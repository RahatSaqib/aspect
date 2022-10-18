
# Pakistan TB stats - Rest Api Reference

## Description
This document describes how to consume TB Stats - Rest Api

This API returns a summary of TB tests, TB (Tuberculosis) cases, and DRTB (Drug resistance TB) cases. It allows filtering by date range and returns totals results for the whole country, as well as totals by each state.

## Endpoint
The endpoint is located at: [aspect url]/device/result/pakistan (For example pakistan.aspect.id/device/result/pakistan)

## Authentication
The authentication is made over the deviceApiKey feature on Aspect. That implies that the caller must have an existent valid deviceApiKey.

The deviceApiKey must be sent as a query param called token.

## Request
The parameters accepted are these:
|Parameter|Description|Validation|Example|Observation|
|--- |--- |--- |--- |--- |
|from|Date and Time from|Must be in ISO 8601 format. Must include time zone offset.|from=2022-02-01T00:00:00+05:00|Value must include time offset. A result with the exact date and time, will be included in the query|
|to|Date and Time to|Must be in ISO 8601 format. Must include time zone offset.|to=2022-02-22T16:04:17+05:00|Value must include time offset. A result with the exact date and time, will be excluded from the results.|

### Important
The request dates must be URI encoded, as the standard does not accept literals  `:` and `+` used in ISO8601 dates.
 An example en javascript:
``` lang:javascript
encodeURIComponent('2022-02-03T00:00:00+05:00')
```
Produces the URI valid output:
```
2022-02-03T00%3A00%3A00%2B05%3A00
```
### Request Examples
This query asks for data between February 1st, 2022 and February 22, 2022 in Pakistan Standard Time:

`{{ baseUrl }}/device/result/pakistan?from=2022-02-01T00:00:00+05:00&to=2022-02-22T00:00:00+05:00&token=0tkh-vn27-hnhy-q46a-mxe0`

When Uri encoded:
`{{ baseUrl }}/device/result/pakistan?from=2022-02-01T00%3A00%3A00%2B05%3A00&to=2022-02-22T00%3A00%3A00%2B05%3A00&token=0tkh-vn27-hnhy-q46a-mxe0`


## Response

|Field|Type|Value|
|--- |--- |--- |
|from|ISO 8601 datetime UTC|Datetime from in UTC|
|to|ISO 8601 datetime UTC|Datetime to in UTC|
|countryTotals|Object: countryTotals|Total count of Tests, Cases and DrCases
|stateTotals|Array of Object: stateTotals|List of states with count of Tests, Cases and DrCases|
#### countryTotals
|Field|Type|Value|
|--- |--- |--- |
|tests|integer|Count of Tests performed|
|cases|integer|Count of Cases detected|
|drCases|integer|Count of Drug Resistance Cases detected|

#### stateTotals
|Field|Type|Value|
|--- |--- |--- |
|stateCode|string|State Abbreviation|
|state|string|State Name|
|tests|integer|Count of Tests performed|
|cases|integer|Count of Cases detected|
|drCases|integer|Count of Drug Resistance Cases detected|

### Response Example
``` lang: json
{
	"from": "2022-01-31T19:00:00.000Z",
	"to": "2022-02-21T19:00:00.000Z",
	"countryTotals": {
		"tests": 3658,
		"cases": 1442,
		"drCases": 562
	},
	"stateTotals": [
		{
			"stateCode": "PB",
			"state": "Punjab",
			"tests": 354,
			"cases": 126,
			"drCases": 25
		},
		{
			"stateCode": "",
			"state": "Sindh",
			"tests": 254,
			"cases": 101,
			"drCases": 32
		}
		....
	]
}
```