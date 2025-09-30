/* eslint-disable no-bitwise */
const MOBILE_SOURCE = 1
const RESULT_SOURCE = 2
const isMobileSample = source => !!(source & MOBILE_SOURCE)
const isResultSample = source => !!(source & RESULT_SOURCE)

module.exports = { MOBILE_SOURCE, RESULT_SOURCE, isMobileSample, isResultSample }
