import expect from 'expect.js'

import {
  calcPercentageSplitBar,
  formatDataForPie,
  getAverageFromData,
  groupByKey,
  normaliseKeys,
} from '../index'

import variables from '../../../../../../../cfg/variables.js'
import intl from './mocks/intl.js'
import assayFromState from './mocks/assayFromState.js'
import {
  aggregateDataCategory1DetectedIn,
  aggregateDataCategory1DetectedExpectedOut,
  aggregateDataCategory1DetectedAverageLegendExpectedOut,
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
    describe('byMonthSimpleGroupBy', () => {
      it('should transpose the keys and data correctly', () => {
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
    describe('byMonthSimpleGroupBy', () => {
      it('should calculate percentages correctly and add up close to 100%', () => {
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

  describe('formatDataForPie', () => {
    describe('Scenario 1', () => {
      it('should format data correctly for Pie graphs', () => {
        Object.assign(process.env, variables.customPropertiesVariables)
        const keyToConsume = 'resultCategory2'
        const indexBy = 'cnt'
        const displayMethod = 'percentage'
        const filterResults = false
        const scenarioCase = 'case1'
        const formatted = formatDataForPie(
          aggregateDataCategory1DetectedIn[scenarioCase],
          keyToConsume,
          indexBy,
          assayFromState,
          displayMethod,
          filterResults
        )
        expect(formatted).to.eql(
          aggregateDataCategory1DetectedExpectedOut[scenarioCase]
        )
      })
    })
  })

  describe('getAverageFromData', () => {
    describe('Scenario 1', () => {
      it('should format data correctly for Pie graphs: Scenario 1', () => {
        Object.assign(process.env, variables.customPropertiesVariables)
        const keyToConsume = 'resultCategory2'
        const indexBy = 'cnt'
        const displayMethod = 'percentage'
        const filterResults = false
        const valueKey = 'value'
        const valueToConsume = 'Detected'
        const scenarioCase = 'case1'
        const formatted = formatDataForPie(
          aggregateDataCategory1DetectedIn[scenarioCase],
          keyToConsume,
          indexBy,
          assayFromState,
          displayMethod,
          filterResults
        )
        const calculated = getAverageFromData(
          formatted,
          valueKey,
          valueToConsume
        )
        expect(calculated).to.eql(
          aggregateDataCategory1DetectedAverageLegendExpectedOut[scenarioCase]
        )
      })
    })

    describe('Scenario 2', () => {
      it('should format data correctly for Pie graphs: Scenario 2', () => {
        Object.assign(process.env, variables.customPropertiesVariables)
        const keyToConsume = 'resultCategory2'
        const indexBy = 'cnt'
        const displayMethod = 'percentage'
        const filterResults = false
        const valueKey = 'value'
        const valueToConsume = 'Detected'
        const scenarioCase = 'case2'
        const formatted = formatDataForPie(
          aggregateDataCategory1DetectedIn[scenarioCase],
          keyToConsume,
          indexBy,
          assayFromState,
          displayMethod,
          filterResults
        )
        const calculated = getAverageFromData(
          formatted,
          valueKey,
          valueToConsume
        )
        expect(calculated).to.eql(
          aggregateDataCategory1DetectedAverageLegendExpectedOut[scenarioCase]
        )
      })
    })

    describe('Scenario 3', () => {
      it('should format data correctly for Pie graphs: Scenario 3', () => {
        Object.assign(process.env, variables.customPropertiesVariables)
        const keyToConsume = 'resultCategory1'
        const indexBy = 'cnt'
        const displayMethod = 'percentage'
        const filterResults = false
        const valueKey = 'value'
        const valueToConsume = ['Not Detected', '< 1000']
        const scenarioCase = 'case3'
        const formatted = formatDataForPie(
          aggregateDataCategory1DetectedIn[scenarioCase],
          keyToConsume,
          indexBy,
          assayFromState,
          displayMethod,
          filterResults
        )
        const calculated = getAverageFromData(
          formatted,
          valueKey,
          valueToConsume
        )
        expect(calculated).to.eql(
          aggregateDataCategory1DetectedAverageLegendExpectedOut[scenarioCase]
        )
      })
    })

    describe('Scenario 4', () => {
      it('should return {} when empty: Scenario 4', () => {
        Object.assign(process.env, variables.customPropertiesVariables)
        const keyToConsume = 'resultCategory1'
        const indexBy = 'cnt'
        const displayMethod = 'percentage'
        const filterResults = false
        const valueKey = 'value'
        const valueToConsume = ['Not Detected', '< 1000']
        const scenarioCase = 'case4'
        const formatted = formatDataForPie(
          aggregateDataCategory1DetectedIn[scenarioCase],
          keyToConsume,
          indexBy,
          assayFromState,
          displayMethod,
          filterResults
        )
        const calculated = getAverageFromData(
          formatted,
          valueKey,
          valueToConsume
        )
        expect(calculated).to.eql({})
      })
    })
  })
})
