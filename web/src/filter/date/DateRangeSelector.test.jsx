import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import DatePicker from 'material-ui/DatePicker'
import MenuItem from 'material-ui/MenuItem'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'
import { DateRangeSelector } from './DateRangeSelector'

describe('DateRangeSelector Component', () => {
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
      formatDate: (date, formatOptions) =>
        new Intl.DateTimeFormat('en-US', formatOptions).format(date),
    },
    clearButtonTooltip: 'Clear',
    clearButtonStyle: {},
    onChangeDate: sinon.spy(),
    floatingLabelText: 'Date Range',
  }
  let DateRangeSelectorWrapper

  beforeEach(() => {
    DateRangeSelectorWrapper = shallow(<DateRangeSelector {...props} />)
  })

  describe('Custom date range', () => {
    it('should show date pickers in place of a dropdown list when a defined range type is deleted', () => {
      DateRangeSelectorWrapper.setState({
        rangeMode: 'custom',
      })
      expect(DateRangeSelectorWrapper.find(ForkedSelectField).length).toEqual(1)
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toEqual(2)
    })

    it('should call onDateChanged when date is picked', () => {
      DateRangeSelectorWrapper.setState({
        rangeMode: 'custom',
      })
      const minDate = new Date(2014, 1, 23)
      const maxDate = new Date(2016, 10, 2)
      DateRangeSelectorWrapper.find(DatePicker)
        .first()
        .simulate('change', undefined, minDate)
      expect(props.onChangeDate.lastCall.args[0]).toEqual({
        minDate: minDate.toJSON(),
      })
      DateRangeSelectorWrapper.find(DatePicker)
        .last()
        .simulate('change', undefined, maxDate)
      const endOfDayMilliseconds = 1000 * 60 * 60 * 24 - 1
      expect(props.onChangeDate.lastCall.args[0]).toEqual({
        maxDate: new Date(maxDate.getTime() + endOfDayMilliseconds).toJSON(),
      })
    })
  })

  describe('Selectable Date Ranges', () => {
    it('should show a dropdown list in place of date pickers when a defined range type is deleted', () => {
      DateRangeSelectorWrapper.setState({
        rangeMode: 'day',
      })
      expect(
        DateRangeSelectorWrapper.find(ForkedSelectField).length
      ).toBeTruthy()
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toBeFalsy()
      DateRangeSelectorWrapper.setState({
        rangeMode: 'week',
      })
      expect(
        DateRangeSelectorWrapper.find(ForkedSelectField).length
      ).toBeTruthy()
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toBeFalsy()
      DateRangeSelectorWrapper.setState({
        rangeMode: 'month',
      })
      expect(
        DateRangeSelectorWrapper.find(ForkedSelectField).length
      ).toBeTruthy()
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toBeFalsy()
      DateRangeSelectorWrapper.setState({
        rangeMode: 'quarter',
      })
      expect(
        DateRangeSelectorWrapper.find(ForkedSelectField).length
      ).toBeTruthy()
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toBeFalsy()
      DateRangeSelectorWrapper.setState({
        rangeMode: 'year',
      })
      expect(
        DateRangeSelectorWrapper.find(ForkedSelectField).length
      ).toBeTruthy()
      expect(DateRangeSelectorWrapper.find(DatePicker).length).toBeFalsy()
    })

    const expectedDateTests = [
      {
        now: new Date(2016, 10, 20, 12, 21, 2, 666),
        today: {
          label: 'Today (11/20)',
          minDate: new Date(2016, 10, 20),
          maxDate: new Date(new Date(2016, 10, 21).getTime() - 1),
        },
        yesterday: {
          label: 'Yesterday (11/19)',
          minDate: new Date(2016, 10, 19),
          maxDate: new Date(new Date(2016, 10, 20).getTime() - 1),
        },
        twoDaysAgo: {
          label: 'Friday, 11/18',
          minDate: new Date(2016, 10, 18),
          maxDate: new Date(new Date(2016, 10, 19).getTime() - 1),
        },
        threeDaysAgo: {
          label: 'Thursday, 11/17',
          minDate: new Date(2016, 10, 17),
          maxDate: new Date(new Date(2016, 10, 18).getTime() - 1),
        },
        fourDaysAgo: {
          label: 'Wednesday, 11/16',
          minDate: new Date(2016, 10, 16),
          maxDate: new Date(new Date(2016, 10, 17).getTime() - 1),
        },
        fiveDaysAgo: {
          label: 'Tuesday, 11/15',
          minDate: new Date(2016, 10, 15),
          maxDate: new Date(new Date(2016, 10, 16).getTime() - 1),
        },
        sixDaysAgo: {
          label: 'Monday, 11/14',
          minDate: new Date(2016, 10, 14),
          maxDate: new Date(new Date(2016, 10, 15).getTime() - 1),
        },
        sevenDaysAgo: {
          label: 'Sunday, 11/13',
          minDate: new Date(2016, 10, 13),
          maxDate: new Date(new Date(2016, 10, 14).getTime() - 1),
        },
        last7Days: {
          label: 'Last 7 Days',
          minDate: new Date(2016, 10, 13),
          maxDate: new Date(new Date(2016, 10, 21).getTime() - 1),
        },
        thisWeek: {
          label: 'This Week (11/20 - 11/26)',
          minDate: new Date(2016, 10, 20),
          maxDate: new Date(new Date(2016, 10, 27).getTime() - 1),
        },
        lastWeek: {
          label: 'Last Week (11/13 - 11/19)',
          minDate: new Date(2016, 10, 13),
          maxDate: new Date(new Date(2016, 10, 20).getTime() - 1),
        },
        twoWeeksAgo: {
          label: 'Sunday, 11/06 - Saturday, 11/12',
          minDate: new Date(2016, 10, 6),
          maxDate: new Date(new Date(2016, 10, 13).getTime() - 1),
        },
        threeWeeksAgo: {
          label: 'Sunday, 10/30 - Saturday, 11/05',
          minDate: new Date(2016, 9, 30),
          maxDate: new Date(new Date(2016, 10, 6).getTime() - 1),
        },
        fourWeeksAgo: {
          label: 'Sunday, 10/23 - Saturday, 10/29',
          minDate: new Date(2016, 9, 23),
          maxDate: new Date(new Date(2016, 9, 30).getTime() - 1),
        },
        fiveWeeksAgo: {
          label: 'Sunday, 10/16 - Saturday, 10/22',
          minDate: new Date(2016, 9, 16),
          maxDate: new Date(new Date(2016, 9, 23).getTime() - 1),
        },
        sixWeeksAgo: {
          label: 'Sunday, 10/09 - Saturday, 10/15',
          minDate: new Date(2016, 9, 9),
          maxDate: new Date(new Date(2016, 9, 16).getTime() - 1),
        },
        sevenWeeksAgo: {
          label: 'Sunday, 10/02 - Saturday, 10/08',
          minDate: new Date(2016, 9, 2),
          maxDate: new Date(new Date(2016, 9, 9).getTime() - 1),
        },
        last30Days: {
          label: 'Last 30 Days',
          minDate: new Date(2016, 9, 21),
          maxDate: new Date(new Date(2016, 10, 21).getTime() - 1),
        },
        thisMonth: {
          label: 'This Month (11/01 - 11/30)',
          minDate: new Date(2016, 10, 1),
          maxDate: new Date(new Date(2016, 11, 1).getTime() - 1),
        },
        lastMonth: {
          label: 'Last Month (10/01 - 10/31)',
          minDate: new Date(2016, 9, 1),
          maxDate: new Date(new Date(2016, 10, 1).getTime() - 1),
        },
        twoMonthsAgo: {
          label: 'September 2016',
          minDate: new Date(2016, 8, 1),
          maxDate: new Date(new Date(2016, 9, 1).getTime() - 1),
        },
        threeMonthsAgo: {
          label: 'August 2016',
          minDate: new Date(2016, 7, 1),
          maxDate: new Date(new Date(2016, 8, 1).getTime() - 1),
        },
        fourMonthsAgo: {
          label: 'July 2016',
          minDate: new Date(2016, 6, 1),
          maxDate: new Date(new Date(2016, 7, 1).getTime() - 1),
        },
        fiveMonthsAgo: {
          label: 'June 2016',
          minDate: new Date(2016, 5, 1),
          maxDate: new Date(new Date(2016, 6, 1).getTime() - 1),
        },
        sixMonthsAgo: {
          label: 'May 2016',
          minDate: new Date(2016, 4, 1),
          maxDate: new Date(new Date(2016, 5, 1).getTime() - 1),
        },
        sevenMonthsAgo: {
          label: 'April 2016',
          minDate: new Date(2016, 3, 1),
          maxDate: new Date(new Date(2016, 4, 1).getTime() - 1),
        },
        eightMonthsAgo: {
          label: 'March 2016',
          minDate: new Date(2016, 2, 1),
          maxDate: new Date(new Date(2016, 3, 1).getTime() - 1),
        },
        nineMonthsAgo: {
          label: 'February 2016',
          minDate: new Date(2016, 1, 1),
          maxDate: new Date(new Date(2016, 2, 1).getTime() - 1),
        },
        tenMonthsAgo: {
          label: 'January 2016',
          minDate: new Date(2016, 0, 1),
          maxDate: new Date(new Date(2016, 1, 1).getTime() - 1),
        },
        elevenMonthsAgo: {
          label: 'December 2015',
          minDate: new Date(2015, 11, 1),
          maxDate: new Date(new Date(2016, 0, 1).getTime() - 1),
        },
        thisQuarter: {
          label: 'This Quarter',
          minDate: new Date(2016, 9, 1),
          maxDate: new Date(new Date(2017, 0, 1).getTime() - 1),
        },
        lastQuarter: {
          label: 'Quarter 3 2016',
          minDate: new Date(2016, 6, 1),
          maxDate: new Date(new Date(2016, 9, 1).getTime() - 1),
        },
        twoQuartersAgo: {
          label: 'Quarter 2 2016',
          minDate: new Date(2016, 3, 1),
          maxDate: new Date(new Date(2016, 6, 1).getTime() - 1),
        },
        threeQuartersAgo: {
          label: 'Quarter 1 2016',
          minDate: new Date(2016, 0, 1),
          maxDate: new Date(new Date(2016, 3, 1).getTime() - 1),
        },
        fourQuartersAgo: {
          label: 'Quarter 4 2015',
          minDate: new Date(2015, 9, 1),
          maxDate: new Date(new Date(2016, 0, 1).getTime() - 1),
        },
        fiveQuartersAgo: {
          label: 'Quarter 3 2015',
          minDate: new Date(2015, 6, 1),
          maxDate: new Date(new Date(2015, 9, 1).getTime() - 1),
        },
        sixQuartersAgo: {
          label: 'Quarter 2 2015',
          minDate: new Date(2015, 3, 1),
          maxDate: new Date(new Date(2015, 6, 1).getTime() - 1),
        },
        sevenQuartersAgo: {
          label: 'Quarter 1 2015',
          minDate: new Date(2015, 0, 1),
          maxDate: new Date(new Date(2015, 3, 1).getTime() - 1),
        },
        eightQuartersAgo: {
          label: 'Quarter 4 2014',
          minDate: new Date(2014, 9, 1),
          maxDate: new Date(new Date(2015, 0, 1).getTime() - 1),
        },
        nineQuartersAgo: {
          label: 'Quarter 3 2014',
          minDate: new Date(2014, 6, 1),
          maxDate: new Date(new Date(2014, 9, 1).getTime() - 1),
        },
        tenQuartersAgo: {
          label: 'Quarter 2 2014',
          minDate: new Date(2014, 3, 1),
          maxDate: new Date(new Date(2014, 6, 1).getTime() - 1),
        },
        elevenQuartersAgo: {
          label: 'Quarter 1 2014',
          minDate: new Date(2014, 0, 1),
          maxDate: new Date(new Date(2014, 3, 1).getTime() - 1),
        },
        thisYear: {
          label: 'This Year (2016)',
          minDate: new Date(2016, 0, 1),
          maxDate: new Date(new Date(2017, 0, 1).getTime() - 1),
        },
        lastYear: {
          label: 'Last Year (2015)',
          minDate: new Date(2015, 0, 1),
          maxDate: new Date(new Date(2016, 0, 1).getTime() - 1),
        },
        twoYearsAgo: {
          label: '2014',
          minDate: new Date(2014, 0, 1),
          maxDate: new Date(new Date(2015, 0, 1).getTime() - 1),
        },
        threeYearsAgo: {
          label: '2013',
          minDate: new Date(2013, 0, 1),
          maxDate: new Date(new Date(2014, 0, 1).getTime() - 1),
        },
        fourYearsAgo: {
          label: '2012',
          minDate: new Date(2012, 0, 1),
          maxDate: new Date(new Date(2013, 0, 1).getTime() - 1),
        },
        fiveYearsAgo: {
          label: '2011',
          minDate: new Date(2011, 0, 1),
          maxDate: new Date(new Date(2012, 0, 1).getTime() - 1),
        },
        sixYearsAgo: {
          label: '2010',
          minDate: new Date(2010, 0, 1),
          maxDate: new Date(new Date(2011, 0, 1).getTime() - 1),
        },
      },
      {
        now: new Date(2012, 0, 16, 15, 3, 6, 231),
        today: {
          label: 'Today (01/16)',
          minDate: new Date(2012, 0, 16),
          maxDate: new Date(new Date(2012, 0, 17).getTime() - 1),
        },
        yesterday: {
          label: 'Yesterday (01/15)',
          minDate: new Date(2012, 0, 15),
          maxDate: new Date(new Date(2012, 0, 16).getTime() - 1),
        },
        twoDaysAgo: {
          label: 'Saturday, 01/14',
          minDate: new Date(2012, 0, 14),
          maxDate: new Date(new Date(2012, 0, 15).getTime() - 1),
        },
        threeDaysAgo: {
          label: 'Friday, 01/13',
          minDate: new Date(2012, 0, 13),
          maxDate: new Date(new Date(2012, 0, 14).getTime() - 1),
        },
        fourDaysAgo: {
          label: 'Thursday, 01/12',
          minDate: new Date(2012, 0, 12),
          maxDate: new Date(new Date(2012, 0, 13).getTime() - 1),
        },
        fiveDaysAgo: {
          label: 'Wednesday, 01/11',
          minDate: new Date(2012, 0, 11),
          maxDate: new Date(new Date(2012, 0, 12).getTime() - 1),
        },
        sixDaysAgo: {
          label: 'Tuesday, 01/10',
          minDate: new Date(2012, 0, 10),
          maxDate: new Date(new Date(2012, 0, 11).getTime() - 1),
        },
        sevenDaysAgo: {
          label: 'Monday, 01/09',
          minDate: new Date(2012, 0, 9),
          maxDate: new Date(new Date(2012, 0, 10).getTime() - 1),
        },
        last7Days: {
          label: 'Last 7 Days',
          minDate: new Date(2012, 0, 9),
          maxDate: new Date(new Date(2012, 0, 17).getTime() - 1),
        },
        thisWeek: {
          label: 'This Week (01/15 - 01/21)',
          minDate: new Date(2012, 0, 15),
          maxDate: new Date(new Date(2012, 0, 22).getTime() - 1),
        },
        lastWeek: {
          label: 'Last Week (01/08 - 01/14)',
          minDate: new Date(2012, 0, 8),
          maxDate: new Date(new Date(2012, 0, 15).getTime() - 1),
        },
        twoWeeksAgo: {
          label: 'Sunday, 01/01 - Saturday, 01/07',
          minDate: new Date(2012, 0, 1),
          maxDate: new Date(new Date(2012, 0, 8).getTime() - 1),
        },
        threeWeeksAgo: {
          label: 'Sunday, 12/25 - Saturday, 12/31',
          minDate: new Date(2011, 11, 25),
          maxDate: new Date(new Date(2012, 0, 1).getTime() - 1),
        },
        fourWeeksAgo: {
          label: 'Sunday, 12/18 - Saturday, 12/24',
          minDate: new Date(2011, 11, 18),
          maxDate: new Date(new Date(2011, 11, 25).getTime() - 1),
        },
        fiveWeeksAgo: {
          label: 'Sunday, 12/11 - Saturday, 12/17',
          minDate: new Date(2011, 11, 11),
          maxDate: new Date(new Date(2011, 11, 18).getTime() - 1),
        },
        sixWeeksAgo: {
          label: 'Sunday, 12/04 - Saturday, 12/10',
          minDate: new Date(2011, 11, 4),
          maxDate: new Date(new Date(2011, 11, 11).getTime() - 1),
        },
        sevenWeeksAgo: {
          label: 'Sunday, 11/27 - Saturday, 12/03',
          minDate: new Date(2011, 10, 27),
          maxDate: new Date(new Date(2011, 11, 4).getTime() - 1),
        },
        last30Days: {
          label: 'Last 30 Days',
          minDate: new Date(2011, 11, 17),
          maxDate: new Date(new Date(2012, 0, 17).getTime() - 1),
        },
        thisMonth: {
          label: 'This Month (01/01 - 01/31)',
          minDate: new Date(2012, 0, 1),
          maxDate: new Date(new Date(2012, 1, 1).getTime() - 1),
        },
        lastMonth: {
          label: 'Last Month (12/01 - 12/31)',
          minDate: new Date(2011, 11, 1),
          maxDate: new Date(new Date(2012, 0, 1).getTime() - 1),
        },
        twoMonthsAgo: {
          label: 'November 2011',
          minDate: new Date(2011, 10, 1),
          maxDate: new Date(new Date(2011, 11, 1).getTime() - 1),
        },
        threeMonthsAgo: {
          label: 'October 2011',
          minDate: new Date(2011, 9, 1),
          maxDate: new Date(new Date(2011, 10, 1).getTime() - 1),
        },
        fourMonthsAgo: {
          label: 'September 2011',
          minDate: new Date(2011, 8, 1),
          maxDate: new Date(new Date(2011, 9, 1).getTime() - 1),
        },
        fiveMonthsAgo: {
          label: 'August 2011',
          minDate: new Date(2011, 7, 1),
          maxDate: new Date(new Date(2011, 8, 1).getTime() - 1),
        },
        sixMonthsAgo: {
          label: 'July 2011',
          minDate: new Date(2011, 6, 1),
          maxDate: new Date(new Date(2011, 7, 1).getTime() - 1),
        },
        sevenMonthsAgo: {
          label: 'June 2011',
          minDate: new Date(2011, 5, 1),
          maxDate: new Date(new Date(2011, 6, 1).getTime() - 1),
        },
        eightMonthsAgo: {
          label: 'May 2011',
          minDate: new Date(2011, 4, 1),
          maxDate: new Date(new Date(2011, 5, 1).getTime() - 1),
        },
        nineMonthsAgo: {
          label: 'April 2011',
          minDate: new Date(2011, 3, 1),
          maxDate: new Date(new Date(2011, 4, 1).getTime() - 1),
        },
        tenMonthsAgo: {
          label: 'March 2011',
          minDate: new Date(2011, 2, 1),
          maxDate: new Date(new Date(2011, 3, 1).getTime() - 1),
        },
        elevenMonthsAgo: {
          label: 'February 2011',
          minDate: new Date(2011, 1, 1),
          maxDate: new Date(new Date(2011, 2, 1).getTime() - 1),
        },
        thisQuarter: {
          label: 'This Quarter',
          minDate: new Date(2012, 0, 1),
          maxDate: new Date(new Date(2012, 3, 1).getTime() - 1),
        },
        lastQuarter: {
          label: 'Quarter 4 2011',
          minDate: new Date(2011, 9, 1),
          maxDate: new Date(new Date(2012, 0, 1).getTime() - 1),
        },
        twoQuartersAgo: {
          label: 'Quarter 3 2011',
          minDate: new Date(2011, 6, 1),
          maxDate: new Date(new Date(2011, 9, 1).getTime() - 1),
        },
        threeQuartersAgo: {
          label: 'Quarter 2 2011',
          minDate: new Date(2011, 3, 1),
          maxDate: new Date(new Date(2011, 6, 1).getTime() - 1),
        },
        fourQuartersAgo: {
          label: 'Quarter 1 2011',
          minDate: new Date(2011, 0, 1),
          maxDate: new Date(new Date(2011, 3, 1).getTime() - 1),
        },
        fiveQuartersAgo: {
          label: 'Quarter 4 2010',
          minDate: new Date(2010, 9, 1),
          maxDate: new Date(new Date(2011, 0, 1).getTime() - 1),
        },
        sixQuartersAgo: {
          label: 'Quarter 3 2010',
          minDate: new Date(2010, 6, 1),
          maxDate: new Date(new Date(2010, 9, 1).getTime() - 1),
        },
        sevenQuartersAgo: {
          label: 'Quarter 2 2010',
          minDate: new Date(2010, 3, 1),
          maxDate: new Date(new Date(2010, 6, 1).getTime() - 1),
        },
        eightQuartersAgo: {
          label: 'Quarter 1 2010',
          minDate: new Date(2010, 0, 1),
          maxDate: new Date(new Date(2010, 3, 1).getTime() - 1),
        },
        nineQuartersAgo: {
          label: 'Quarter 4 2009',
          minDate: new Date(2009, 9, 1),
          maxDate: new Date(new Date(2010, 0, 1).getTime() - 1),
        },
        tenQuartersAgo: {
          label: 'Quarter 3 2009',
          minDate: new Date(2009, 6, 1),
          maxDate: new Date(new Date(2009, 9, 1).getTime() - 1),
        },
        elevenQuartersAgo: {
          label: 'Quarter 2 2009',
          minDate: new Date(2009, 3, 1),
          maxDate: new Date(new Date(2009, 6, 1).getTime() - 1),
        },
        thisYear: {
          label: 'This Year (2012)',
          minDate: new Date(2012, 0, 1),
          maxDate: new Date(new Date(2013, 0, 1).getTime() - 1),
        },
        lastYear: {
          label: 'Last Year (2011)',
          minDate: new Date(2011, 0, 1),
          maxDate: new Date(new Date(2012, 0, 1).getTime() - 1),
        },
        twoYearsAgo: {
          label: '2010',
          minDate: new Date(2010, 0, 1),
          maxDate: new Date(new Date(2011, 0, 1).getTime() - 1),
        },
        threeYearsAgo: {
          label: '2009',
          minDate: new Date(2009, 0, 1),
          maxDate: new Date(new Date(2010, 0, 1).getTime() - 1),
        },
        fourYearsAgo: {
          label: '2008',
          minDate: new Date(2008, 0, 1),
          maxDate: new Date(new Date(2009, 0, 1).getTime() - 1),
        },
        fiveYearsAgo: {
          label: '2007',
          minDate: new Date(2007, 0, 1),
          maxDate: new Date(new Date(2008, 0, 1).getTime() - 1),
        },
        sixYearsAgo: {
          label: '2006',
          minDate: new Date(2006, 0, 1),
          maxDate: new Date(new Date(2007, 0, 1).getTime() - 1),
        },
      },
    ]

    expectedDateTests.forEach(expectedDateTest => {
      describe('Different Range Types', () => {
        let clock

        beforeAll(() => {
          clock = sinon.useFakeTimers(expectedDateTest.now.getTime())
        })

        afterAll(() => {
          clock.restore()
        })

        it('should allow the user to select one of the last 8 days', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'day',
          })
          const dropDownListItems = DateRangeSelectorWrapper.find(
            ForkedSelectField
          )
            .at(1)
            .find(MenuItem)
          expect(dropDownListItems.length).toEqual(8)
          const firstItemInDropDownList = dropDownListItems.at(0)
          expect(firstItemInDropDownList.props()).toEqual({
            ...firstItemInDropDownList.props(),
            value: expectedDateTest.today,
            primaryText: expectedDateTest.today.label,
          })
          const secondItemInDropDownList = dropDownListItems.at(1)
          expect(secondItemInDropDownList.props()).toEqual({
            ...secondItemInDropDownList.props(),
            value: expectedDateTest.yesterday,
            primaryText: expectedDateTest.yesterday.label,
          })
          const thirdItemInDropDownList = dropDownListItems.at(2)
          expect(thirdItemInDropDownList.props()).toEqual({
            ...thirdItemInDropDownList.props(),
            value: expectedDateTest.twoDaysAgo,
            primaryText: expectedDateTest.twoDaysAgo.label,
          })
          const forthItemInDropDownList = dropDownListItems.at(3)
          expect(forthItemInDropDownList.props()).toEqual({
            ...forthItemInDropDownList.props(),
            value: expectedDateTest.threeDaysAgo,
            primaryText: expectedDateTest.threeDaysAgo.label,
          })
          const fifthItemInDropDownList = dropDownListItems.at(4)
          expect(fifthItemInDropDownList.props()).toEqual({
            ...fifthItemInDropDownList.props(),
            value: expectedDateTest.fourDaysAgo,
            primaryText: expectedDateTest.fourDaysAgo.label,
          })
          const sixthItemInDropDownList = dropDownListItems.at(5)
          expect(sixthItemInDropDownList.props()).toEqual({
            ...sixthItemInDropDownList.props(),
            value: expectedDateTest.fiveDaysAgo,
            primaryText: expectedDateTest.fiveDaysAgo.label,
          })
          const seventhItemInDropDownList = dropDownListItems.at(6)
          expect(seventhItemInDropDownList.props()).toEqual({
            ...seventhItemInDropDownList.props(),
            value: expectedDateTest.sixDaysAgo,
            primaryText: expectedDateTest.sixDaysAgo.label,
          })
          const lastItemInDropDownList = dropDownListItems.last()
          expect(lastItemInDropDownList.props()).toEqual({
            ...lastItemInDropDownList.props(),
            value: expectedDateTest.sevenDaysAgo,
            primaryText: expectedDateTest.sevenDaysAgo.label,
          })
        })

        it('should allow the user to select the last 7 days or any one of the last 8 weeks', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'week',
          })
          const dropDownListItems = DateRangeSelectorWrapper.find(
            ForkedSelectField
          )
            .at(1)
            .find(MenuItem)
          expect(dropDownListItems.length).toEqual(9)
          const firstItemInDropDownList = dropDownListItems.at(0)
          expect(firstItemInDropDownList.props()).toEqual({
            ...firstItemInDropDownList.props(),
            value: expectedDateTest.last7Days,
            primaryText: expectedDateTest.last7Days.label,
          })
          const secondItemInDropDownList = dropDownListItems.at(1)
          expect(secondItemInDropDownList.props()).toEqual({
            ...secondItemInDropDownList.props(),
            value: expectedDateTest.thisWeek,
            primaryText: expectedDateTest.thisWeek.label,
          })
          const thirdItemInDropDownList = dropDownListItems.at(2)
          expect(thirdItemInDropDownList.props()).toEqual({
            ...thirdItemInDropDownList.props(),
            value: expectedDateTest.lastWeek,
            primaryText: expectedDateTest.lastWeek.label,
          })
          const forthItemInDropDownList = dropDownListItems.at(3)
          expect(forthItemInDropDownList.props()).toEqual({
            ...forthItemInDropDownList.props(),
            value: expectedDateTest.twoWeeksAgo,
            primaryText: expectedDateTest.twoWeeksAgo.label,
          })
          const fifthItemInDropDownList = dropDownListItems.at(4)
          expect(fifthItemInDropDownList.props()).toEqual({
            ...fifthItemInDropDownList.props(),
            value: expectedDateTest.threeWeeksAgo,
            primaryText: expectedDateTest.threeWeeksAgo.label,
          })
          const sixthItemInDropDownList = dropDownListItems.at(5)
          expect(sixthItemInDropDownList.props()).toEqual({
            ...sixthItemInDropDownList.props(),
            value: expectedDateTest.fourWeeksAgo,
            primaryText: expectedDateTest.fourWeeksAgo.label,
          })
          const seventhItemInDropDownList = dropDownListItems.at(6)
          expect(seventhItemInDropDownList.props()).toEqual({
            ...seventhItemInDropDownList.props(),
            value: expectedDateTest.fiveWeeksAgo,
            primaryText: expectedDateTest.fiveWeeksAgo.label,
          })
          const eighthItemInDropDownList = dropDownListItems.at(7)
          expect(eighthItemInDropDownList.props()).toEqual({
            ...eighthItemInDropDownList.props(),
            value: expectedDateTest.sixWeeksAgo,
            primaryText: expectedDateTest.sixWeeksAgo.label,
          })
          const lastItemInDropDownList = dropDownListItems.last()
          expect(lastItemInDropDownList.props()).toEqual({
            ...lastItemInDropDownList.props(),
            value: expectedDateTest.sevenWeeksAgo,
            primaryText: expectedDateTest.sevenWeeksAgo.label,
          })
        })

        it('should allow the user to select the last 30 days or any one of the last 12 months', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'month',
          })
          const dropDownListItems = DateRangeSelectorWrapper.find(
            ForkedSelectField
          )
            .at(1)
            .find(MenuItem)
          expect(dropDownListItems.length).toEqual(13)
          const firstItemInDropDownList = dropDownListItems.at(0)
          expect(firstItemInDropDownList.props()).toEqual({
            ...firstItemInDropDownList.props(),
            value: expectedDateTest.last30Days,
            primaryText: expectedDateTest.last30Days.label,
          })
          const secondItemInDropDownList = dropDownListItems.at(1)
          expect(secondItemInDropDownList.props()).toEqual({
            ...secondItemInDropDownList.props(),
            value: expectedDateTest.thisMonth,
            primaryText: expectedDateTest.thisMonth.label,
          })
          const thirdItemInDropDownList = dropDownListItems.at(2)
          expect(thirdItemInDropDownList.props()).toEqual({
            ...thirdItemInDropDownList.props(),
            value: expectedDateTest.lastMonth,
            primaryText: expectedDateTest.lastMonth.label,
          })
          const forthItemInDropDownList = dropDownListItems.at(3)
          expect(forthItemInDropDownList.props()).toEqual({
            ...forthItemInDropDownList.props(),
            value: expectedDateTest.twoMonthsAgo,
            primaryText: expectedDateTest.twoMonthsAgo.label,
          })
          const fifthItemInDropDownList = dropDownListItems.at(4)
          expect(fifthItemInDropDownList.props()).toEqual({
            ...fifthItemInDropDownList.props(),
            value: expectedDateTest.threeMonthsAgo,
            primaryText: expectedDateTest.threeMonthsAgo.label,
          })
          const sixthItemInDropDownList = dropDownListItems.at(5)
          expect(sixthItemInDropDownList.props()).toEqual({
            ...sixthItemInDropDownList.props(),
            value: expectedDateTest.fourMonthsAgo,
            primaryText: expectedDateTest.fourMonthsAgo.label,
          })
          const seventhItemInDropDownList = dropDownListItems.at(6)
          expect(seventhItemInDropDownList.props()).toEqual({
            ...seventhItemInDropDownList.props(),
            value: expectedDateTest.fiveMonthsAgo,
            primaryText: expectedDateTest.fiveMonthsAgo.label,
          })
          const eighthItemInDropDownList = dropDownListItems.at(7)
          expect(eighthItemInDropDownList.props()).toEqual({
            ...eighthItemInDropDownList.props(),
            value: expectedDateTest.sixMonthsAgo,
            primaryText: expectedDateTest.sixMonthsAgo.label,
          })
          const ninthItemInDropDownList = dropDownListItems.at(8)
          expect(ninthItemInDropDownList.props()).toEqual({
            ...ninthItemInDropDownList.props(),
            value: expectedDateTest.sevenMonthsAgo,
            primaryText: expectedDateTest.sevenMonthsAgo.label,
          })
          const tenthItemInDropDownList = dropDownListItems.at(9)
          expect(tenthItemInDropDownList.props()).toEqual({
            ...tenthItemInDropDownList.props(),
            value: expectedDateTest.eightMonthsAgo,
            primaryText: expectedDateTest.eightMonthsAgo.label,
          })
          const eleventhItemInDropDownList = dropDownListItems.at(10)
          expect(eleventhItemInDropDownList.props()).toEqual({
            ...eleventhItemInDropDownList.props(),
            value: expectedDateTest.nineMonthsAgo,
            primaryText: expectedDateTest.nineMonthsAgo.label,
          })
          const twelfthItemInDropDownList = dropDownListItems.at(11)
          expect(twelfthItemInDropDownList.props()).toEqual({
            ...twelfthItemInDropDownList.props(),
            value: expectedDateTest.tenMonthsAgo,
            primaryText: expectedDateTest.tenMonthsAgo.label,
          })
          const lastItemInDropDownList = dropDownListItems.last()
          expect(lastItemInDropDownList.props()).toEqual({
            ...lastItemInDropDownList.props(),
            value: expectedDateTest.elevenMonthsAgo,
            primaryText: expectedDateTest.elevenMonthsAgo.label,
          })
        })

        it('should allow the user to select any one of the last 12 quarters', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'quarter',
          })
          const dropDownListItems = DateRangeSelectorWrapper.find(
            ForkedSelectField
          )
            .at(1)
            .find(MenuItem)
          expect(dropDownListItems.length).toEqual(12)
          const firstItemInDropDownList = dropDownListItems.at(0)
          expect(firstItemInDropDownList.props()).toEqual({
            ...firstItemInDropDownList.props(),
            value: expectedDateTest.thisQuarter,
            primaryText: expectedDateTest.thisQuarter.label,
          })
          const secondItemInDropDownList = dropDownListItems.at(1)
          expect(secondItemInDropDownList.props()).toEqual({
            ...secondItemInDropDownList.props(),
            value: expectedDateTest.lastQuarter,
            primaryText: expectedDateTest.lastQuarter.label,
          })
          const thirdItemInDropDownList = dropDownListItems.at(2)
          expect(thirdItemInDropDownList.props()).toEqual({
            ...thirdItemInDropDownList.props(),
            value: expectedDateTest.twoQuartersAgo,
            primaryText: expectedDateTest.twoQuartersAgo.label,
          })
          const forthItemInDropDownList = dropDownListItems.at(3)
          expect(forthItemInDropDownList.props()).toEqual({
            ...forthItemInDropDownList.props(),
            value: expectedDateTest.threeQuartersAgo,
            primaryText: expectedDateTest.threeQuartersAgo.label,
          })
          const fifthItemInDropDownList = dropDownListItems.at(4)
          expect(fifthItemInDropDownList.props()).toEqual({
            ...fifthItemInDropDownList.props(),
            value: expectedDateTest.fourQuartersAgo,
            primaryText: expectedDateTest.fourQuartersAgo.label,
          })
          const sixthItemInDropDownList = dropDownListItems.at(5)
          expect(sixthItemInDropDownList.props()).toEqual({
            ...sixthItemInDropDownList.props(),
            value: expectedDateTest.fiveQuartersAgo,
            primaryText: expectedDateTest.fiveQuartersAgo.label,
          })
          const seventhItemInDropDownList = dropDownListItems.at(6)
          expect(seventhItemInDropDownList.props()).toEqual({
            ...seventhItemInDropDownList.props(),
            value: expectedDateTest.sixQuartersAgo,
            primaryText: expectedDateTest.sixQuartersAgo.label,
          })
          const eighthItemInDropDownList = dropDownListItems.at(7)
          expect(eighthItemInDropDownList.props()).toEqual({
            ...eighthItemInDropDownList.props(),
            value: expectedDateTest.sevenQuartersAgo,
            primaryText: expectedDateTest.sevenQuartersAgo.label,
          })
          const ninthItemInDropDownList = dropDownListItems.at(8)
          expect(ninthItemInDropDownList.props()).toEqual({
            ...ninthItemInDropDownList.props(),
            value: expectedDateTest.eightQuartersAgo,
            primaryText: expectedDateTest.eightQuartersAgo.label,
          })
          const tenthItemInDropDownList = dropDownListItems.at(9)
          expect(tenthItemInDropDownList.props()).toEqual({
            ...tenthItemInDropDownList.props(),
            value: expectedDateTest.nineQuartersAgo,
            primaryText: expectedDateTest.nineQuartersAgo.label,
          })
          const eleventhItemInDropDownList = dropDownListItems.at(10)
          expect(eleventhItemInDropDownList.props()).toEqual({
            ...eleventhItemInDropDownList.props(),
            value: expectedDateTest.tenQuartersAgo,
            primaryText: expectedDateTest.tenQuartersAgo.label,
          })
          const lastItemInDropDownList = dropDownListItems.last()
          expect(lastItemInDropDownList.props()).toEqual({
            ...lastItemInDropDownList.props(),
            value: expectedDateTest.elevenQuartersAgo,
            primaryText: expectedDateTest.elevenQuartersAgo.label,
          })
        })

        it('should allow the user to select any one of the last 7 years', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'year',
          })
          const dropDownListItems = DateRangeSelectorWrapper.find(
            ForkedSelectField
          )
            .at(1)
            .find(MenuItem)
          expect(dropDownListItems.length).toEqual(7)
          const firstItemInDropDownList = dropDownListItems.at(0)
          expect(firstItemInDropDownList.props()).toEqual({
            ...firstItemInDropDownList.props(),
            value: expectedDateTest.thisYear,
            primaryText: expectedDateTest.thisYear.label,
          })
          const secondItemInDropDownList = dropDownListItems.at(1)
          expect(secondItemInDropDownList.props()).toEqual({
            ...secondItemInDropDownList.props(),
            value: expectedDateTest.lastYear,
            primaryText: expectedDateTest.lastYear.label,
          })
          const thirdItemInDropDownList = dropDownListItems.at(2)
          expect(thirdItemInDropDownList.props()).toEqual({
            ...thirdItemInDropDownList.props(),
            value: expectedDateTest.twoYearsAgo,
            primaryText: expectedDateTest.twoYearsAgo.label,
          })
          const forthItemInDropDownList = dropDownListItems.at(3)
          expect(forthItemInDropDownList.props()).toEqual({
            ...forthItemInDropDownList.props(),
            value: expectedDateTest.threeYearsAgo,
            primaryText: expectedDateTest.threeYearsAgo.label,
          })
          const fifthItemInDropDownList = dropDownListItems.at(4)
          expect(fifthItemInDropDownList.props()).toEqual({
            ...fifthItemInDropDownList.props(),
            value: expectedDateTest.fourYearsAgo,
            primaryText: expectedDateTest.fourYearsAgo.label,
          })
          const sixthItemInDropDownList = dropDownListItems.at(5)
          expect(sixthItemInDropDownList.props()).toEqual({
            ...sixthItemInDropDownList.props(),
            value: expectedDateTest.fiveYearsAgo,
            primaryText: expectedDateTest.fiveYearsAgo.label,
          })
          const lastItemInDropDownList = dropDownListItems.last()
          expect(lastItemInDropDownList.props()).toEqual({
            ...lastItemInDropDownList.props(),
            value: expectedDateTest.sixYearsAgo,
            primaryText: expectedDateTest.sixYearsAgo.label,
          })
        })

        it('should call onDateChanged when a date range is picked', () => {
          DateRangeSelectorWrapper.setState({
            rangeMode: 'day',
          })
          DateRangeSelectorWrapper.find(ForkedSelectField)
            .at(1)
            .simulate(
              'change',
              undefined,
              undefined,
              expectedDateTest.twoDaysAgo
            )
          expect(props.onChangeDate.lastCall.args[0]).toEqual({
            minDate: expectedDateTest.twoDaysAgo.minDate.toJSON(),
            maxDate: expectedDateTest.twoDaysAgo.maxDate.toJSON(),
          })
          DateRangeSelectorWrapper.setState({
            rangeMode: 'week',
          })
          DateRangeSelectorWrapper.find(ForkedSelectField)
            .at(1)
            .simulate('change', undefined, undefined, expectedDateTest.lastWeek)
          expect(props.onChangeDate.lastCall.args[0]).toEqual({
            minDate: expectedDateTest.lastWeek.minDate.toJSON(),
            maxDate: expectedDateTest.lastWeek.maxDate.toJSON(),
          })
        })
      })
    })
  })
})
