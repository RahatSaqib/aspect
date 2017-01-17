// Imports from packages
import _ from 'lodash'
import endOfDay from 'date-fns/end_of_day'
import startOfDay from 'date-fns/start_of_day'
import subtractDays from 'date-fns/sub_days'
import endOfWeek from 'date-fns/end_of_week'
import startOfWeek from 'date-fns/start_of_week'
import subtractWeeks from 'date-fns/sub_weeks'
import endOfMonth from 'date-fns/end_of_month'
import startOfMonth from 'date-fns/start_of_month'
import subtractMonths from 'date-fns/sub_months'
import endOfQuarter from 'date-fns/end_of_quarter'
import startOfQuarter from 'date-fns/start_of_quarter'
import subtractQuarters from 'date-fns/sub_quarters'
import getQuarter from 'date-fns/get_quarter'
import endOfYear from 'date-fns/end_of_year'
import startOfYear from 'date-fns/start_of_year'
import subtractYears from 'date-fns/sub_years'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
import DatePicker from 'material-ui/DatePicker'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'

// Our own imports
import ForkedSelectField from '../../components/forkedMaterialUi/ForkedSelectField'
import styles from './DateRangeSelector.css'

const messages = defineMessages({
  any: {
    id: 'pages.dateRangeSelector.any',
    defaultMessage: 'Any'
  },
  day: {
    id: 'pages.dateRangeSelector.day',
    defaultMessage: 'Day'
  },
  week: {
    id: 'pages.dateRangeSelector.week',
    defaultMessage: 'Week'
  },
  month: {
    id: 'pages.dateRangeSelector.month',
    defaultMessage: 'Month'
  },
  quarter: {
    id: 'pages.dateRangeSelector.quarter',
    defaultMessage: 'Quarter'
  },
  year: {
    id: 'pages.dateRangeSelector.year',
    defaultMessage: 'Year'
  },
  selectDay: {
    id: 'pages.dateRangeSelector.selectDay',
    defaultMessage: 'Select Day...'
  },
  selectWeek: {
    id: 'pages.dateRangeSelector.selectWeek',
    defaultMessage: 'Select Week...'
  },
  selectMonth: {
    id: 'pages.dateRangeSelector.selectMonth',
    defaultMessage: 'Select Month...'
  },
  selectQuarter: {
    id: 'pages.dateRangeSelector.selectQuarter',
    defaultMessage: 'Select Quarter...'
  },
  selectYear: {
    id: 'pages.dateRangeSelector.selectYear',
    defaultMessage: 'Select Year...'
  },
  fromDate: {
    id: 'pages.dateRangeSelector.fromDate',
    defaultMessage: 'From...'
  },
  toDate: {
    id: 'pages.dateRangeSelector.toDate',
    defaultMessage: 'To...'
  },
  custom: {
    id: 'pages.dateRangeSelector.custom',
    defaultMessage: 'Custom'
  },
  today: {
    id: 'pages.dateRangeSelector.today',
    defaultMessage: 'Today'
  },
  yesterday: {
    id: 'pages.dateRangeSelector.yesterday',
    defaultMessage: 'Yesterday'
  },
  last30Days: {
    id: 'pages.dateRangeSelector.last30Days',
    defaultMessage: 'Last 30 Days'
  },
  thisMonth: {
    id: 'pages.dateRangeSelector.thisMonth',
    defaultMessage: 'This Month'
  },
  lastMonth: {
    id: 'pages.dateRangeSelector.lastMonth',
    defaultMessage: 'Last Month'
  },
  last7Days: {
    id: 'pages.dateRangeSelector.last7Days',
    defaultMessage: 'Last 7 Days'
  },
  thisWeek: {
    id: 'pages.dateRangeSelector.thisWeek',
    defaultMessage: 'This Week'
  },
  lastWeek: {
    id: 'pages.dateRangeSelector.lastWeek',
    defaultMessage: 'Last Week'
  },
  thisQuarter: {
    id: 'pages.dateRangeSelector.thisQuarter',
    defaultMessage: 'This Quarter'
  },
  thisYear: {
    id: 'pages.dateRangeSelector.thisYear',
    defaultMessage: 'This Year'
  },
  lastYear: {
    id: 'pages.dateRangeSelector.lastYear',
    defaultMessage: 'Last Year'
  }
})

export class DateRangeSelector extends PureComponent {

  static propTypes = {
    intl: PropTypes.object.isRequired,
    onChangeDate: PropTypes.func.isRequired,
    floatingLabelText: PropTypes.string.isRequired,
    minDate: PropTypes.string,
    maxDate: PropTypes.string
  }

  state = {
    rangeMode: 'any'
  }

  getDaysSelectList = () => {
    const { intl: { formatMessage, formatDate } } = this.props
    const now = new Date()
    const yesterday = subtractDays(now, 1)
    const daysBeforeYesterday = []
    for (let i = 2; i < 8; i++) {
      daysBeforeYesterday.push(subtractDays(now, i))
    }
    return [{
      label: `${formatMessage(messages.today)} (${formatDate(now, { day: '2-digit', month: '2-digit' })})`,
      minDate: startOfDay(now),
      maxDate: endOfDay(now)
    }, {
      label: `${formatMessage(messages.yesterday)} (${formatDate(yesterday, { day: '2-digit', month: '2-digit' })})`,
      minDate: startOfDay(yesterday),
      maxDate: endOfDay(yesterday)
    }, ..._.map(daysBeforeYesterday, (day) => {
      const selectItem = {
        label: formatDate(day, { weekday: 'long', day: '2-digit', month: '2-digit' }),
        minDate: startOfDay(day),
        maxDate: endOfDay(day)
      }
      return selectItem
    })]
  }

  getWeeksSelectList = () => {
    const { intl: { formatMessage, formatDate } } = this.props
    const now = new Date()
    const last7DaysStart = subtractDays(now, 7)
    const thisWeekStart = startOfWeek(now)
    const thisWeekEnd = endOfWeek(now)
    const lastWeek = subtractWeeks(now, 1)
    const lastWeekStart = startOfWeek(lastWeek)
    const lastWeekEnd = endOfWeek(lastWeek)
    const weeksBeforeLast = []
    for (let i = 2; i < 8; i++) {
      weeksBeforeLast.push(subtractWeeks(now, i))
    }
    return [{
      label: `${formatMessage(messages.last7Days)}`,
      minDate: startOfDay(last7DaysStart),
      maxDate: endOfDay(now)
    }, {
      label: `${formatMessage(messages.thisWeek)} (${formatDate(thisWeekStart, { day: '2-digit', month: '2-digit' })} - ${formatDate(thisWeekEnd, { day: '2-digit', month: '2-digit' })})`,
      minDate: thisWeekStart,
      maxDate: thisWeekEnd
    }, {
      label: `${formatMessage(messages.lastWeek)} (${formatDate(lastWeekStart, { day: '2-digit', month: '2-digit' })} - ${formatDate(lastWeekEnd, { day: '2-digit', month: '2-digit' })})`,
      minDate: lastWeekStart,
      maxDate: lastWeekEnd
    }, ..._.map(weeksBeforeLast, (dayInWeek) => {
      const weekStart = startOfWeek(dayInWeek)
      const weekEnd = endOfWeek(dayInWeek)
      return {
        label: `${formatDate(weekStart, { weekday: 'long', day: '2-digit', month: '2-digit' })} - ${formatDate(weekEnd, { weekday: 'long', day: '2-digit', month: '2-digit' })}`,
        minDate: startOfDay(weekStart),
        maxDate: endOfDay(weekEnd)
      }
    })]
  }

  getMonthsSelectList = () => {
    const { intl: { formatMessage, formatDate } } = this.props
    const now = new Date()
    const last30DaysStart = subtractDays(now, 30)
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonth = subtractMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)
    const monthsBeforeLast = []
    for (let i = 2; i < 12; i++) {
      monthsBeforeLast.push(subtractMonths(now, i))
    }
    return [{
      label: `${formatMessage(messages.last30Days)}`,
      minDate: startOfDay(last30DaysStart),
      maxDate: endOfDay(now)
    }, {
      label: `${formatMessage(messages.thisMonth)} (${formatDate(thisMonthStart, { day: '2-digit', month: '2-digit' })} - ${formatDate(thisMonthEnd, { day: '2-digit', month: '2-digit' })})`,
      minDate: thisMonthStart,
      maxDate: thisMonthEnd
    }, {
      label: `${formatMessage(messages.lastMonth)} (${formatDate(lastMonthStart, { day: '2-digit', month: '2-digit' })} - ${formatDate(lastMonthEnd, { day: '2-digit', month: '2-digit' })})`,
      minDate: lastMonthStart,
      maxDate: lastMonthEnd
    }, ..._.map(monthsBeforeLast, (dayInMonth) => {
      const monthStart = startOfMonth(dayInMonth)
      const monthEnd = endOfMonth(dayInMonth)
      return {
        label: formatDate(monthStart, { month: 'long', year: 'numeric' }),
        minDate: startOfDay(monthStart),
        maxDate: endOfDay(monthEnd)
      }
    })]
  }

  getQuartersSelectList = () => {
    const { intl: { formatMessage, formatDate } } = this.props
    const now = new Date()
    const thisQuarterStart = startOfQuarter(now)
    const thisQuarterEnd = endOfQuarter(now)
    const previousQuarters = []
    for (let i = 1; i < 12; i++) {
      previousQuarters.push(subtractQuarters(now, i))
    }
    return [{
      label: `${formatMessage(messages.thisQuarter)}`,
      minDate: startOfDay(thisQuarterStart),
      maxDate: endOfDay(thisQuarterEnd)
    }, ..._.map(previousQuarters, (dayInQuarter) => {
      const quarterStart = startOfQuarter(dayInQuarter)
      const quarterEnd = endOfQuarter(dayInQuarter)
      return {
        label: `${formatMessage(messages.quarter)} ${getQuarter(dayInQuarter)} ${formatDate(dayInQuarter, { year: 'numeric' })}`,
        minDate: startOfDay(quarterStart),
        maxDate: endOfDay(quarterEnd)
      }
    })]
  }

  getYearsSelectList = () => {
    const { intl: { formatMessage, formatDate } } = this.props
    const now = new Date()
    const thisYearStart = startOfYear(now)
    const thisYearEnd = endOfYear(now)
    const lastYear = subtractYears(now, 1)
    const lastYearStart = startOfYear(lastYear)
    const lastYearEnd = endOfYear(lastYear)
    const yearsBeforeLast = []
    for (let i = 2; i < 7; i++) {
      yearsBeforeLast.push(subtractYears(now, i))
    }
    return [{
      label: `${formatMessage(messages.thisYear)} (${formatDate(thisYearStart, { year: 'numeric' })})`,
      minDate: thisYearStart,
      maxDate: thisYearEnd
    }, {
      label: `${formatMessage(messages.lastYear)} (${formatDate(lastYearStart, { year: 'numeric' })})`,
      minDate: lastYearStart,
      maxDate: lastYearEnd
    }, ..._.map(yearsBeforeLast, (dayInYear) => {
      const yearStart = startOfYear(dayInYear)
      const yearEnd = endOfYear(dayInYear)
      return {
        label: formatDate(yearStart, { year: 'numeric' }),
        minDate: startOfDay(yearStart),
        maxDate: endOfDay(yearEnd)
      }
    })]
  }

  getMinDate() {
    const { minDate } = this.props
    return minDate && new Date(minDate)
  }

  getMaxDate() {
    const { maxDate } = this.props
    return maxDate && new Date(maxDate)
  }

  handleMaxDateChange = (event, date) => {
    this.props.onChangeDate({ maxDate: endOfDay(date).toJSON() })
  }

  handleMinDateChange = (event, date) => {
    this.props.onChangeDate({ minDate: date.toJSON() })
  }

  handleDateRangeChange = (event, index, value) => {
    this.props.onChangeDate(value ?
    { minDate: value.minDate.toJSON(), maxDate: value.maxDate.toJSON() } :
    { minDate: null, maxDate: null })
  }

  handleRangeModeChange = (event, index, value) => {
    this.setState({
      rangeMode: value
    })
    this.props.onChangeDate({ minDate: null, maxDate: null })
  }

  render() {
    const { intl: { formatMessage }, floatingLabelText } = this.props

    const dropDownSelectItems = {
      any: [],
      day: this.getDaysSelectList(),
      week: this.getWeeksSelectList(),
      month: this.getMonthsSelectList(),
      quarter: this.getQuartersSelectList(),
      year: this.getYearsSelectList(),
      custom: []
    }[this.state.rangeMode]

    const dropDownListHintText = {
      any: '',
      day: formatMessage(messages.selectDay),
      week: formatMessage(messages.selectWeek),
      month: formatMessage(messages.selectMonth),
      quarter: formatMessage(messages.selectQuarter),
      year: formatMessage(messages.selectYear),
      custom: ''
    }[this.state.rangeMode]

    const selectedValue = _.find(dropDownSelectItems,
      { minDate: this.getMinDate(), maxDate: this.getMaxDate() })

    const restProps = _.omit(this.props, [
      'floatingLabelText', 'clearButtonTooltip', 'onChangeDate', 'minDate', 'maxDate', 'intl'
    ])
    return (
      <div className={styles.DateRangeSelector}>
        <ForkedSelectField
          className={styles.DateRangeSelector__RangeModeSelector}
          floatingLabelText={floatingLabelText}
          floatingLabelFixed
          hintText={dropDownListHintText}
          value={this.state.rangeMode}
          onChange={this.handleRangeModeChange}
          menuStyle={{ minWidth: '7em' }}
        >
          <MenuItem value="any" primaryText={formatMessage(messages.any)} />
          <Divider />
          <MenuItem value="day" primaryText={formatMessage(messages.day)} />
          <MenuItem value="week" primaryText={formatMessage(messages.week)} />
          <MenuItem value="month" primaryText={formatMessage(messages.month)} />
          <MenuItem value="quarter" primaryText={formatMessage(messages.quarter)} />
          <MenuItem value="year" primaryText={formatMessage(messages.year)} />
          <Divider />
          <MenuItem value="custom" primaryText={formatMessage(messages.custom)} />
        </ForkedSelectField>
        {(() => {
          switch (this.state.rangeMode) {
            case 'any': return false
            case 'custom': return (
              <div className={styles.DateRangeSelector__DatePickerContainer}>
                <DatePicker
                  {...restProps}
                  floatingLabelText=" "
                  floatingLabelFixed
                  className={styles.DateRangeSelector__DatePicker}
                  value={this.getMinDate()}
                  onChange={this.handleMinDateChange}
                  hintText={formatMessage(messages.fromDate)}
                  container="inline"
                  mode="landscape"
                />
                <DatePicker
                  {..._.omit(restProps, 'floatingLabelText')}
                  floatingLabelText=" "
                  floatingLabelFixed
                  className={styles.DateRangeSelector__DatePicker}
                  value={this.getMaxDate()}
                  onChange={this.handleMaxDateChange}
                  hintText={formatMessage(messages.toDate)}
                  container="inline"
                  mode="landscape"
                />
              </div>
            )
            default: return (
              <ForkedSelectField
                className={styles.DateRangeSelector__DropDownList}
                floatingLabelText=" "
                floatingLabelFixed
                hintText={dropDownListHintText}
                value={selectedValue}
                autoWidth
                onChange={this.handleDateRangeChange}
              >
                {
                  dropDownSelectItems.map(dropDownSelectItem =>
                    <MenuItem
                      key={dropDownSelectItem.minDate} value={dropDownSelectItem}
                      primaryText={dropDownSelectItem.label}
                    />)
                }
              </ForkedSelectField>
            )
          }
        })()}
      </div>
    )
  }
}

export default injectIntl(DateRangeSelector)
