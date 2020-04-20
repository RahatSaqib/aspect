import { shallow } from 'enzyme'
import expect from 'expect.js'

import { calcPercentageSplitBar, groupByKey, normaliseKeys } from '../index'

import intl from './mocks/intl.js'
import {
  byMonthSimpleGroupByIn,
  byMonthSimpleGroupByExpectedOut,
  normalisedByMonthSimpleOutExpected,
  percentageSplitByMonthSimpleExpectedOut,
  byMonthResultCategory1DetectedIn,
  byMonthResultCategory1DetectedExpectedOut,
} from './mocks/data.js'

describe('Clinical Indicators Helpers', () => {
  describe('groupByKey', () => {
    describe('byMonthSimpleGroupBy', () => {
      it('should group data by key correctly', () => {
        const indexBy = 'month'
        const keyToConsume = 'resultCategory1'
        const formatDate = 'MMM yyyy'
        const grouped = groupByKey(
          byMonthSimpleGroupByIn,
          indexBy,
          keyToConsume,
          formatDate,
          intl
        )
        expect(grouped).to.eql(byMonthSimpleGroupByExpectedOut)
      })
    })

    describe('groupByKeyMonthResultCategory1Detected', () => {
      it('should group data by key correctly', () => {
        const indexBy = 'month'
        const keyToConsume = 'resultCategory2'
        const formatDate = 'MMM yyyy'
        const grouped = groupByKey(
          byMonthResultCategory1DetectedIn,
          indexBy,
          keyToConsume,
          formatDate,
          intl
        )
        expect(grouped).to.eql(byMonthResultCategory1DetectedExpectedOut)
      })
    })
  })

  describe('normaliseKeys', () => {
    describe('', () => {
      it('should transpose the keys and data correctly: byMonthSimpleGroupBy', () => {
        const indexBy = 'month'
        const filterResults = false
        const keyToConsume = 'resultCategory1'
        const formatDate = 'MMM yyyy'
        const grouped = groupByKey(
          byMonthSimpleGroupByIn,
          indexBy,
          keyToConsume,
          formatDate,
          intl
        )
        const normalised = normaliseKeys(grouped, filterResults, indexBy)
        expect(normalised).to.eql(normalisedByMonthSimpleOutExpected)
      })
    })
  })

  describe('calcPercentageSplitBar', () => {
    describe('', () => {
      it('should calculate percentages correctly and add up to 100%: byMonthSimpleGroupBy', () => {
        const indexBy = 'month'
        const filterResults = false
        const keyToConsume = 'resultCategory1'
        const formatDate = 'MMM yyyy'
        const grouped = groupByKey(
          byMonthSimpleGroupByIn,
          indexBy,
          keyToConsume,
          formatDate,
          intl
        )
        const normalised = normaliseKeys(grouped, filterResults, indexBy)
        const display = calcPercentageSplitBar(normalised, indexBy)
        expect(display).to.eql(percentageSplitByMonthSimpleExpectedOut)
      })
    })
  })
})
