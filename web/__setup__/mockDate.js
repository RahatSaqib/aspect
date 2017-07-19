/*
 * Ref: https://github.com/facebook/jest/issues/2234
 */
const MOCKED_DATE_NOW = 1500000000000
Date.now = jest.fn(() => MOCKED_DATE_NOW)
