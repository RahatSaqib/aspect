const _ = require('lodash')

function transformResultText(data) {
  if (_.isNil(data.resultData)) return {}
  const json = JSON.parse(data.resultData)
  return {
    copies: json.copies ?? null,
    log: json.log ?? null,
    resultText: json.resultText ?? null,
  }
}

module.exports = { transformResultText }
