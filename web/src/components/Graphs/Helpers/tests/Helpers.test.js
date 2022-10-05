import format from 'date-fns/format'
import {
  calcPercentageSplitBar,
  getISOFromString,
  generateToolTip,
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
  barDataForToolTipsNovIn1,
  barDataForToolTipsNovIn2,
  barDataForToolTipsNovIn3,
  barDataForToolTipsNovOut1,
  barDataForToolTipsNovOut2,
  barDataForToolTipsNovOut3,
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
import { itemMocked, assaysMocked } from './mocks/tooltips'

describe('Graph Helpers', () => {
  describe('Data transformations for individual graphs', () => {
    describe('Barchart: groupByKey', () => {
      it('should group data by key correctly - normally for bar', () => {
        const indexBy = 'month'
        const displayMethod = 'actual'
        const keyToConsume = 'resultCategory1'
        const formatDate = 'MMM yyyy'
        const filterBy = false
        const grouped = groupByKey(barDataActualFromAPIIn, indexBy, keyToConsume, displayMethod, formatDate, filterBy)
        expect(grouped).toEqual(barDataActualFromAPIOut)
      })
    })

    describe('Piechart: groupForPie', () => {
      it('should group data by key correctly', () => {
        const indexBy = 'cnt'
        const keyToConsume = 'resultCategory1'
        const filterBy = false
        const grouped = groupForPie(pieDataActualFromAPIIn, keyToConsume, indexBy, filterBy)
        expect(grouped).toEqual(pieDataActualFromAPIOut)
      })
    })

    describe('PieRowchart: groupForPieRow', () => {
      it('should group data by types correctly', () => {
        const mergedParams = [{ currentMonth: `${format(new Date(), 'yyyy-MM')}-01` }]
        const grouped = groupForPieRow(pieRowDataFromAPIIn, mergedParams)
        expect(grouped).toEqual(pieRowDataFromAPIOut)
      })
    })

    describe('Barchart (Treatment Status): groupForOldTreatmentAPI', () => {
      it('should group data by key correctly - for old treatment API bar', () => {
        const indexBy = 'monthTested'
        const keyToConsume = 'pcOnTreatment'
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
        const keyToConsume = 'pcOnTreatment'
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
        const keyToConsume = 'pcOnTreatment'
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
        const keyToConsume = 'pcOnTreatment'
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
        const grouped = groupForDivergent(divergentDataFromAPIIn, indexBy, keyToConsume, filterBy)
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
        expect(grouped).toEqual(tickDataForBarYAxisShapeBookendsDisplayPercentageOut)
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
        expect(grouped).toEqual(tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut)
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
        expect(grouped).toEqual(tickDataForBarYAxisShapeBookendsDisplayActualOut)
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
        expect(grouped).toEqual(tickDataForBarYAxisShapeClubSandwichDisplayActualOut)
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
        const normalised = normaliseKeys(groupByKeyGrouped, filterResults, indexBy)
        const display = calcPercentageSplitBar(normalised, indexBy)
        expect(display).toEqual(tickDataForBarDisplayMethodPercentageIn)
      })
    })
  })

  describe('Generate Tooltips', () => {
    describe('generateToolTip', () => {
      const displayMethod = 'percentage'
      const assaysFromState = assaysMocked
      const type = 'bar'
      const formatNumber = number =>
        new Intl.NumberFormat('en-US', {
          style: 'percent',
          maximumFractionDigits: 2,
        }).format(number)

      it('Should calculate tooltip correctly test 1', async () => {
        const item = { ...itemMocked, ...barDataForToolTipsNovIn1 }
        const tooltip = await generateToolTip(item, displayMethod, assaysFromState, formatNumber, type)
        expect(tooltip).toEqual(barDataForToolTipsNovOut1)
      })

      it('Should calculate tooltip correctly test 2', async () => {
        const item = { ...itemMocked, ...barDataForToolTipsNovIn2 }
        const tooltip = await generateToolTip(item, displayMethod, assaysFromState, formatNumber, type)
        expect(tooltip).toEqual(barDataForToolTipsNovOut2)
      })

      it('Should calculate tooltip correctly test 3', async () => {
        const item = { ...itemMocked, ...barDataForToolTipsNovIn3 }
        const tooltip = await generateToolTip(item, displayMethod, assaysFromState, formatNumber, type)
        expect(tooltip).toEqual(barDataForToolTipsNovOut3)
      })
    })
  })

  describe('Date formats', () => {
    it('Should return a valid ISO date with offset', async () => {
      const validDates = [
        { inDate: '2019-09-19', expected: '2019-09-19T00:00:00.000+02:00' },
        {
          inDate: '2020-02-08T13:18:00',
          expected: '2020-02-08T13:18:00.000+01:00',
        },
        {
          inDate: '2019-08-28 11:11:00',
          expected: '2019-08-28T11:11:00.000+02:00',
        },
        {
          inDate: '1977-04-04 09:30:10',
          expected: '1977-04-04T09:30:10.000+02:00',
        },
        {
          inDate: new Date(2020, 10, 27, 5, 0),
          expected: '2020-11-27T05:00:00.000+01:00',
        },
      ]
      const invalidDates = [
        {
          inDate: null,
        },
        {
          // eslint-disable-next-line no-void
          inDate: void 0,
        },
      ]
      validDates.map(({ inDate, expected }) => {
        const outData = getISOFromString(inDate)
        return expect(expected).toEqual(outData)
      })
      invalidDates.map(({ inDate }) => {
        const expected = getISOFromString(inDate)
        return expect(expected).toBeTruthy()
      })
    })
  })
})
