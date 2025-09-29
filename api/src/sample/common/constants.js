/* eslint-disable no-bitwise */
const MOBILE_SOURCE = 1
const RESULT_SOURCE = 2
const isMobileSource = source => !!(source & MOBILE_SOURCE)
const isResultSource = source => !!(source & RESULT_SOURCE)

module.exports = { MOBILE_SOURCE, RESULT_SOURCE, isMobileSource, isResultSource }
