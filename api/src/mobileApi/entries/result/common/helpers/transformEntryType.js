const _ = require('lodash')
const { TEST_TYPE } = require('../../../common/consts')
const { transformTestInformation } = require('./transformTestInformation')

function transformEntryType(data) {
  const testInformation = transformTestInformation(data)
  switch (true) {
    case _.isEmpty(testInformation):
      return TEST_TYPE.SAMPLE

    default:
      return TEST_TYPE.RESULT
  }
}

module.exports = { transformEntryType }
