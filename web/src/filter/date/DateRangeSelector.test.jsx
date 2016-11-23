import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { DateRangeSelector } from './DateRangeSelector'
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'
import MenuItem from 'material-ui/MenuItem'

describe.only('DateRangeSelector Component', () => {
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
      formatDate: (date, formatOptions) => new Intl.DateTimeFormat('en-US', formatOptions).format(date)
    },
    clearButtonTooltip: 'Clear',
    clearButtonStyle: {},
    onChangeDate: sinon.spy()
  }

  const expectedDateTests = [{
    now: new Date(2016, 10, 20, 12, 21, 2, 666),
    today: {
      label: 'Today (11/20)',
      minDate: new Date(2016, 10, 20),
      maxDate: new Date((new Date(2016, 10, 21)).getTime() - 1)
    },
    yesterday: {
      label: 'Yesterday (11/19)',
      minDate: new Date(2016, 10, 19),
      maxDate: new Date((new Date(2016, 10, 20)).getTime() - 1)
    },
    twoDaysAgo: {
      label: 'Friday, 11/18',
      minDate: new Date(2016, 10, 18),
      maxDate: new Date((new Date(2016, 10, 19)).getTime() - 1)
    },
    threeDaysAgo: {
      label: 'Thursday, 11/17',
      minDate: new Date(2016, 10, 17),
      maxDate: new Date((new Date(2016, 10, 18)).getTime() - 1)
    },
    fourDaysAgo: {
      label: 'Wednesday, 11/16',
      minDate: new Date(2016, 10, 16),
      maxDate: new Date((new Date(2016, 10, 17)).getTime() - 1)
    },
    fiveDaysAgo: {
      label: 'Tuesday, 11/15',
      minDate: new Date(2016, 10, 15),
      maxDate: new Date((new Date(2016, 10, 16)).getTime() - 1)
    },
    sixDaysAgo: {
      label: 'Monday, 11/14',
      minDate: new Date(2016, 10, 14),
      maxDate: new Date((new Date(2016, 10, 15)).getTime() - 1)
    },
    sevenDaysAgo: {
      label: 'Sunday, 11/13',
      minDate: new Date(2016, 10, 13),
      maxDate: new Date((new Date(2016, 10, 14)).getTime() - 1)
    },
    last7Days: {
      label: 'Last 7 Days',
      minDate: new Date(2016, 10, 13),
      maxDate: new Date((new Date(2016, 10, 21)).getTime() - 1)
    },
    thisWeek: {
      label: 'This Week (11/20 - 11/26)',
      minDate: new Date(2016, 10, 20),
      maxDate: new Date((new Date(2016, 10, 27)).getTime() - 1)
    },
    lastWeek: {
      label: 'Last Week (11/13 - 11/19)',
      minDate: new Date(2016, 10, 13),
      maxDate: new Date((new Date(2016, 10, 20)).getTime() - 1)
    },
    twoWeeksAgo: {
      label: 'Sunday, 11/06 - Saturday, 11/12',
      minDate: new Date(2016, 10, 6),
      maxDate: new Date((new Date(2016, 10, 13)).getTime() - 1)
    },
    threeWeeksAgo: {
      label: 'Sunday, 10/30 - Saturday, 11/05',
      minDate: new Date(2016, 9, 30),
      maxDate: new Date((new Date(2016, 10, 6)).getTime() - 1)
    },
    fourWeeksAgo: {
      label: 'Sunday, 10/23 - Saturday, 10/29',
      minDate: new Date(2016, 9, 23),
      maxDate: new Date((new Date(2016, 9, 30)).getTime() - 1)
    },
    fiveWeeksAgo: {
      label: 'Sunday, 10/16 - Saturday, 10/22',
      minDate: new Date(2016, 9, 16),
      maxDate: new Date((new Date(2016, 9, 23)).getTime() - 1)
    },
    sixWeeksAgo: {
      label: 'Sunday, 10/09 - Saturday, 10/15',
      minDate: new Date(2016, 9, 9),
      maxDate: new Date((new Date(2016, 9, 16)).getTime() - 1)
    },
    sevenWeeksAgo: {
      label: 'Sunday, 10/02 - Saturday, 10/08',
      minDate: new Date(2016, 9, 2),
      maxDate: new Date((new Date(2016, 9, 9)).getTime() - 1)
    }
  }, {
    now: new Date(2012, 0, 16, 15, 3, 6, 231),
    today: {
      label: 'Today (01/16)',
      minDate: new Date(2012, 0, 16),
      maxDate: new Date((new Date(2012, 0, 17)).getTime() - 1)
    },
    yesterday: {
      label: 'Yesterday (01/15)',
      minDate: new Date(2012, 0, 15),
      maxDate: new Date((new Date(2012, 0, 16)).getTime() - 1)
    },
    twoDaysAgo: {
      label: 'Saturday, 01/14',
      minDate: new Date(2012, 0, 14),
      maxDate: new Date((new Date(2012, 0, 15)).getTime() - 1)
    },
    threeDaysAgo: {
      label: 'Friday, 01/13',
      minDate: new Date(2012, 0, 13),
      maxDate: new Date((new Date(2012, 0, 14)).getTime() - 1)
    },
    fourDaysAgo: {
      label: 'Thursday, 01/12',
      minDate: new Date(2012, 0, 12),
      maxDate: new Date((new Date(2012, 0, 13)).getTime() - 1)
    },
    fiveDaysAgo: {
      label: 'Wednesday, 01/11',
      minDate: new Date(2012, 0, 11),
      maxDate: new Date((new Date(2012, 0, 12)).getTime() - 1)
    },
    sixDaysAgo: {
      label: 'Tuesday, 01/10',
      minDate: new Date(2012, 0, 10),
      maxDate: new Date((new Date(2012, 0, 11)).getTime() - 1)
    },
    sevenDaysAgo: {
      label: 'Monday, 01/09',
      minDate: new Date(2012, 0, 9),
      maxDate: new Date((new Date(2012, 0, 10)).getTime() - 1)
    },
    last7Days: {
      label: 'Last 7 Days',
      minDate: new Date(2012, 0, 9),
      maxDate: new Date((new Date(2012, 0, 17)).getTime() - 1)
    },
    thisWeek: {
      label: 'This Week (01/15 - 01/21)',
      minDate: new Date(2012, 0, 15),
      maxDate: new Date((new Date(2012, 0, 22)).getTime() - 1)
    },
    lastWeek: {
      label: 'Last Week (01/08 - 01/14)',
      minDate: new Date(2012, 0, 8),
      maxDate: new Date((new Date(2012, 0, 15)).getTime() - 1)
    },
    twoWeeksAgo: {
      label: 'Sunday, 01/01 - Saturday, 01/07',
      minDate: new Date(2012, 0, 1),
      maxDate: new Date((new Date(2012, 0, 8)).getTime() - 1)
    },
    threeWeeksAgo: {
      label: 'Sunday, 12/25 - Saturday, 12/31',
      minDate: new Date(2011, 11, 25),
      maxDate: new Date((new Date(2012, 0, 1)).getTime() - 1)
    },
    fourWeeksAgo: {
      label: 'Sunday, 12/18 - Saturday, 12/24',
      minDate: new Date(2011, 11, 18),
      maxDate: new Date((new Date(2011, 11, 25)).getTime() - 1)
    },
    fiveWeeksAgo: {
      label: 'Sunday, 12/11 - Saturday, 12/17',
      minDate: new Date(2011, 11, 11),
      maxDate: new Date((new Date(2011, 11, 18)).getTime() - 1)
    },
    sixWeeksAgo: {
      label: 'Sunday, 12/04 - Saturday, 12/10',
      minDate: new Date(2011, 11, 4),
      maxDate: new Date((new Date(2011, 11, 11)).getTime() - 1)
    },
    sevenWeeksAgo: {
      label: 'Sunday, 11/27 - Saturday, 12/03',
      minDate: new Date(2011, 10, 27),
      maxDate: new Date((new Date(2011, 11, 4)).getTime() - 1)
    }
  }]

  expectedDateTests.forEach((expectedDateTest) => {
    describe('Selectable Date Ranges', () => {
      let clock

      before(() => {
        clock = sinon.useFakeTimers(expectedDateTest.now.getTime())
      })

      after(() => {
        clock.restore()
      })

      it('should allow the user to select one of the last 8 days', () => {
        const DateRangeSelectorWrapper = shallow(<DateRangeSelector {...props} />)
        DateRangeSelectorWrapper.setState({
          rangeMode: 'day'
        })
        const dropDownListItems = DateRangeSelectorWrapper.find(ForkedSelectField).find(MenuItem)
        assert.equal(dropDownListItems.length, 8)
        const firstItemInDropDownList = dropDownListItems.at(0)
        assert.deepEqual(firstItemInDropDownList.props(), {
          ...firstItemInDropDownList.props(),
          value: expectedDateTest.today,
          primaryText: expectedDateTest.today.label
        })
        const secondItemInDropDownList = dropDownListItems.at(1)
        assert.deepEqual(secondItemInDropDownList.props(), {
          ...secondItemInDropDownList.props(),
          value: expectedDateTest.yesterday,
          primaryText: expectedDateTest.yesterday.label
        })
        const thirdItemInDropDownList = dropDownListItems.at(2)
        assert.deepEqual(thirdItemInDropDownList.props(), {
          ...thirdItemInDropDownList.props(),
          value: expectedDateTest.twoDaysAgo,
          primaryText: expectedDateTest.twoDaysAgo.label
        })
        const forthItemInDropDownList = dropDownListItems.at(3)
        assert.deepEqual(forthItemInDropDownList.props(), {
          ...forthItemInDropDownList.props(),
          value: expectedDateTest.threeDaysAgo,
          primaryText: expectedDateTest.threeDaysAgo.label
        })
        const fifthItemInDropDownList = dropDownListItems.at(4)
        assert.deepEqual(fifthItemInDropDownList.props(), {
          ...fifthItemInDropDownList.props(),
          value: expectedDateTest.fourDaysAgo,
          primaryText: expectedDateTest.fourDaysAgo.label
        })
        const sixthItemInDropDownList = dropDownListItems.at(5)
        assert.deepEqual(sixthItemInDropDownList.props(), {
          ...sixthItemInDropDownList.props(),
          value: expectedDateTest.fiveDaysAgo,
          primaryText: expectedDateTest.fiveDaysAgo.label
        })
        const seventhItemInDropDownList = dropDownListItems.at(6)
        assert.deepEqual(seventhItemInDropDownList.props(), {
          ...seventhItemInDropDownList.props(),
          value: expectedDateTest.sixDaysAgo,
          primaryText: expectedDateTest.sixDaysAgo.label
        })
        const lastItemInDropDownList = dropDownListItems.last()
        assert.deepEqual(lastItemInDropDownList.props(), {
          ...lastItemInDropDownList.props(),
          value: expectedDateTest.sevenDaysAgo,
          primaryText: expectedDateTest.sevenDaysAgo.label
        })
      })

      it('should allow the user to select the last 7 days or any one of the last 8 weeks', () => {
        const DateRangeSelectorWrapper = shallow(<DateRangeSelector {...props} />)
        DateRangeSelectorWrapper.setState({
          rangeMode: 'week'
        })
        const dropDownListItems = DateRangeSelectorWrapper.find(ForkedSelectField).find(MenuItem)
        assert.equal(dropDownListItems.length, 9)
        const firstItemInDropDownList = dropDownListItems.at(0)
        assert.deepEqual(firstItemInDropDownList.props(), {
          ...firstItemInDropDownList.props(),
          value: expectedDateTest.last7Days,
          primaryText: expectedDateTest.last7Days.label
        })
        const secondItemInDropDownList = dropDownListItems.at(1)
        assert.deepEqual(secondItemInDropDownList.props(), {
          ...secondItemInDropDownList.props(),
          value: expectedDateTest.thisWeek,
          primaryText: expectedDateTest.thisWeek.label
        })
        const thirdItemInDropDownList = dropDownListItems.at(2)
        assert.deepEqual(thirdItemInDropDownList.props(), {
          ...thirdItemInDropDownList.props(),
          value: expectedDateTest.lastWeek,
          primaryText: expectedDateTest.lastWeek.label
        })
        const forthItemInDropDownList = dropDownListItems.at(3)
        assert.deepEqual(forthItemInDropDownList.props(), {
          ...forthItemInDropDownList.props(),
          value: expectedDateTest.twoWeeksAgo,
          primaryText: expectedDateTest.twoWeeksAgo.label
        })
        const fifthItemInDropDownList = dropDownListItems.at(4)
        assert.deepEqual(fifthItemInDropDownList.props(), {
          ...fifthItemInDropDownList.props(),
          value: expectedDateTest.threeWeeksAgo,
          primaryText: expectedDateTest.threeWeeksAgo.label
        })
        const sixthItemInDropDownList = dropDownListItems.at(5)
        assert.deepEqual(sixthItemInDropDownList.props(), {
          ...sixthItemInDropDownList.props(),
          value: expectedDateTest.fourWeeksAgo,
          primaryText: expectedDateTest.fourWeeksAgo.label
        })
        const seventhItemInDropDownList = dropDownListItems.at(6)
        assert.deepEqual(seventhItemInDropDownList.props(), {
          ...seventhItemInDropDownList.props(),
          value: expectedDateTest.fiveWeeksAgo,
          primaryText: expectedDateTest.fiveWeeksAgo.label
        })
        const eighthItemInDropDownList = dropDownListItems.at(7)
        assert.deepEqual(eighthItemInDropDownList.props(), {
          ...eighthItemInDropDownList.props(),
          value: expectedDateTest.sixWeeksAgo,
          primaryText: expectedDateTest.sixWeeksAgo.label
        })
        const lastItemInDropDownList = dropDownListItems.last()
        assert.deepEqual(lastItemInDropDownList.props(), {
          ...lastItemInDropDownList.props(),
          value: expectedDateTest.sevenWeeksAgo,
          primaryText: expectedDateTest.sevenWeeksAgo.label
        })
      })
    })
  })
})
