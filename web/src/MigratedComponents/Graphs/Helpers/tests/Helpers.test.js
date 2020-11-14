import {
  calcPercentageSplitBar,
  groupByKey,
  groupForPie,
  groupForPieRow,
  groupForDeviceStatusAPI,
  groupForDivergent,
  groupForOldTreatmentAPI,
  generateTickValues,
  normaliseKeys,
} from '../Formatters'

import {
  barDataActualFromAPIIn,
  barDataActualFromAPIOut,
  divergentDataFromAPIIn,
  divergentDataFromAPIOut,
  groupByKeyGrouped,
  mockedDeviceStatus,
  mockedDeviceStatusOut,
  pieDataActualFromAPIIn,
  pieDataActualFromAPIOut,
  pieRowDataFromAPIIn,
  pieRowDataFromAPIOut,
  tickDataForBarDisplayMethodPercentageIn,
  tickDataForBarDisplayMethodActualIn,
  tickDataForBarYAxisShapeBookendsDisplayPercentageOut,
  tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut,
  tickDataForBarYAxisShapeBookendsDisplayActualOut,
  tickDataForBarYAxisShapeClubSandwichDisplayActualOut,
  tickDataForBarXAxisShapeBookendDisplayActualOut,
  treatmentAPIOptimumDataIn,
  treatmentAPIOptimumDataOut,
  treatmentAPISkewedDataIn,
  treatmentAPISkewedDataOppositeIn,
  treatmentAPISkewedPercentageDataOut,
  treatmentAPISkewedDataOppositePercentageOut,
  treatmentAPISkewedActualDataOut,
} from './mocks/data.js'

describe('Graph Helpers', () => {
  describe('Data transformations for individual graphs', () => {
    describe('Barchart: groupByKey', () => {
      it('should group data by key correctly - normally for bar', () => {
        const indexBy = 'month'
        const displayMethod = 'actual'
        const keyToConsume = 'resultCategory1'
        const formatDate = 'MMM yyyy'
        const filterBy = false
        const grouped = groupByKey(
          barDataActualFromAPIIn,
          indexBy,
          keyToConsume,
          displayMethod,
          formatDate,
          filterBy
        )
        expect(grouped).toEqual(barDataActualFromAPIOut)
      })
    })

    describe('Piechart: groupForPie', () => {
      it('should group data by key correctly', () => {
        const indexBy = 'cnt'
        const keyToConsume = 'resultCategory1'
        const filterBy = false
        const grouped = groupForPie(
          pieDataActualFromAPIIn,
          keyToConsume,
          indexBy,
          filterBy
        )
        expect(grouped).toEqual(pieDataActualFromAPIOut)
      })
    })

    describe('PieRowchart: groupForPieRow', () => {
      it('should group data by types correctly', () => {
        const mergedParams = [{ currentMonth: '2020-10-01' }]
        const grouped = groupForPieRow(pieRowDataFromAPIIn, mergedParams)
        expect(grouped).toEqual(pieRowDataFromAPIOut)
      })
    })

    describe('Barchart (Treatment Status): groupForOldTreatmentAPI', () => {
      it('should group data by key correctly - for old treatment API bar', () => {
        const indexBy = 'monthTested'
        const keyToConsume = 'pcConfirmed'
        const displayMethod = 'percentage'
        const filterBy = false
        const formatDate = 'MMM yy'
        const grouped = groupForOldTreatmentAPI(
          treatmentAPIOptimumDataIn,
          keyToConsume,
          indexBy,
          formatDate,
          filterBy,
          displayMethod
        )
        expect(grouped).toEqual(treatmentAPIOptimumDataOut)
      })
    })

    describe('Barchart (Treatment Status): groupForOldTreatmentAPI', () => {
      it('should group data by key correctly - Skewed data as percentage', () => {
        const indexBy = 'monthTested'
        const keyToConsume = 'pcConfirmed'
        const displayMethod = 'percentage'
        const filterBy = false
        const formatDate = 'MMM yy'
        const grouped = groupForOldTreatmentAPI(
          treatmentAPISkewedDataIn,
          keyToConsume,
          indexBy,
          formatDate,
          filterBy,
          displayMethod
        )
        expect(grouped).toEqual(treatmentAPISkewedPercentageDataOut)
      })
    })

    describe('Barchart (Treatment Status): groupForOldTreatmentAPI', () => {
      it('should group data by key correctly - Skewed data as percentage opposite', () => {
        const indexBy = 'monthTested'
        const keyToConsume = 'pcConfirmed'
        const displayMethod = 'percentage'
        const filterBy = false
        const formatDate = 'MMM yy'
        const grouped = groupForOldTreatmentAPI(
          treatmentAPISkewedDataOppositeIn,
          keyToConsume,
          indexBy,
          formatDate,
          filterBy,
          displayMethod
        )
        expect(grouped).toEqual(treatmentAPISkewedDataOppositePercentageOut)
      })
    })

    describe('Barchart (Treatment Status): groupForOldTreatmentAPI', () => {
      it('should group data by key correctly - Skewed data as actual', () => {
        const indexBy = 'monthTested'
        const keyToConsume = 'pcConfirmed'
        const displayMethod = 'actual'
        const filterBy = false
        const formatDate = 'MMM yy'
        const grouped = groupForOldTreatmentAPI(
          treatmentAPISkewedDataIn,
          keyToConsume,
          indexBy,
          formatDate,
          filterBy,
          displayMethod
        )
        expect(grouped).toEqual(treatmentAPISkewedActualDataOut)
      })
    })

    describe('Barchart (divergent): groupForDivergent', () => {
      it('should group data by key correctly - for divergent bar', () => {
        const indexBy = 'inRange'
        const keyToConsume = 'gender'
        const filterBy = false
        const grouped = groupForDivergent(
          divergentDataFromAPIIn,
          indexBy,
          keyToConsume,
          filterBy
        )
        expect(grouped).toEqual(divergentDataFromAPIOut)
      })
    })

    describe('Barchart (stackedDevices): groupForDeviceStatus', () => {
      it('should group data by key correctly - for device status bar', () => {
        const keyToConsume = 'devicesActive'
        const indexBy = 'date'
        const formatDate = 'LLLL do'
        const filterBy = false
        const displayMethod = 'percentage'

        const grouped = groupForDeviceStatusAPI(
          mockedDeviceStatus,
          keyToConsume,
          indexBy,
          formatDate,
          filterBy,
          displayMethod
        )
        expect(grouped).toEqual(mockedDeviceStatusOut)
      })
    })
  })

  describe('Generating Axes for graph types', () => {
    describe('Y Axis Percentage: show bookends (tickValuesYShape: bookends)', () => {
      it('Should extract outside boundaries for Y axis', () => {
        const tickValuesYShape = 'bookends'
        const keys = ['MoreThan1000', 'LessThan1000', 'NotDetected']
        const whichAxis = 'Y'
        const zeroOut = true
        const grouped = generateTickValues(
          tickDataForBarDisplayMethodPercentageIn,
          tickValuesYShape,
          keys,
          whichAxis,
          zeroOut
        )
        expect(grouped).toEqual(
          tickDataForBarYAxisShapeBookendsDisplayPercentageOut
        )
      })
    })

    describe('Y Axis Percentage: show clubsandwich (tickValuesYShape: clubsandwich)', () => {
      it('Should extract outside boundaries for Y axis', () => {
        const tickValuesYShape = 'clubsandwich'
        const keys = ['MoreThan1000', 'LessThan1000', 'NotDetected']
        const whichAxis = 'Y'
        const zeroOut = true
        const grouped = generateTickValues(
          tickDataForBarDisplayMethodPercentageIn,
          tickValuesYShape,
          keys,
          whichAxis,
          zeroOut
        )
        expect(grouped).toEqual(
          tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut
        )
      })
    })

    describe('Y Axis Actual: show bookends (tickValuesYShape: bookends)', () => {
      it('Should extract outside boundaries for Y axis', () => {
        const tickValuesYShape = 'bookends'
        const keys = ['MoreThan1000', 'LessThan1000', 'NotDetected']
        const whichAxis = 'Y'
        const zeroOut = true
        const grouped = generateTickValues(
          tickDataForBarDisplayMethodActualIn,
          tickValuesYShape,
          keys,
          whichAxis,
          zeroOut
        )
        expect(grouped).toEqual(
          tickDataForBarYAxisShapeBookendsDisplayActualOut
        )
      })
    })

    describe('Y Axis Actual: show clubsandwich (tickValuesYShape: clubsandwich)', () => {
      it('Should extract outside boundaries for Y axis', () => {
        const tickValuesYShape = 'clubsandwich'
        const keys = ['MoreThan1000', 'LessThan1000', 'NotDetected']
        const whichAxis = 'Y'
        const zeroOut = true
        const grouped = generateTickValues(
          tickDataForBarDisplayMethodActualIn,
          tickValuesYShape,
          keys,
          whichAxis,
          zeroOut
        )
        expect(grouped).toEqual(
          tickDataForBarYAxisShapeClubSandwichDisplayActualOut
        )
      })
    })

    describe('X Axis Percentage: show bookends (tickValuesXShape: bookends)', () => {
      it('Should extract outside boundaries for X axis', () => {
        const tickValuesYShape = 'bookends'
        const indexBy = 'month'
        const whichAxis = 'X'
        const zeroOut = false
        const grouped = generateTickValues(
          tickDataForBarDisplayMethodPercentageIn,
          tickValuesYShape,
          indexBy,
          whichAxis,
          zeroOut
        )
        expect(grouped).toEqual(tickDataForBarXAxisShapeBookendDisplayActualOut)
      })
    })
  })

  describe('Calculate Percentages', () => {
    describe('calcPercentageSplitBar', () => {
      it('Should calculate percentages correctly as close to 100% as possible', () => {
        const indexBy = 'month'
        const filterResults = false
        const normalised = normaliseKeys(
          groupByKeyGrouped,
          filterResults,
          indexBy
        )
        const display = calcPercentageSplitBar(normalised, indexBy)
        expect(display).toEqual(tickDataForBarDisplayMethodPercentageIn)
      })
    })
  })
})
