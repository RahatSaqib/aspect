// Imports from packages
import map from 'lodash/map'
import find from 'lodash/find'
import omit from 'lodash/omit'
import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import subtractDays from 'date-fns/subDays'
import endOfWeek from 'date-fns/endOfWeek'
import startOfWeek from 'date-fns/startOfWeek'
import subtractWeeks from 'date-fns/subWeeks'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subtractMonths from 'date-fns/subMonths'
import endOfQuarter from 'date-fns/endOfQuarter'
import startOfQuarter from 'date-fns/startOfQuarter'
import subtractQuarters from 'date-fns/subQuarters'
import getQuarter from 'date-fns/getQuarter'
import endOfYear from 'date-fns/endOfYear'
import startOfYear from 'date-fns/startOfYear'
import subtractYears from 'date-fns/subYears'
import format from 'date-fns/format'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { injectIntl } from 'react-intl'
// Material-UI
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

// Our own imports
import SelectField from '../../components/shared/SelectField'
import DateTimeInput from '../../components/shared/DateTimeInput'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import PropTypeOf from '../../shared/types'
import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'

import styles from './DateRangeSelector.css'
import messages from './messages'

export class DateRangeSelector extends PureComponent {
  static propTypes = {
    intl: PropTypeOf.intl.isRequired,
    onChangeDate: PropTypes.func.isRequired,
    floatingLabelText: PropTypes.string.isRequired,
    controlClassName: PropTypes.string.isRequired,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
    dateFormat: PropTypes.string,
  }

  static defaultProps = {
    minDate: null,
    maxDate: null,
    dateFormat: 'yyyy-MM-dd',
  }

  state = {
    rangeMode: 'any',
  }

  getDaysSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
    const now = new Date()
    const yesterday = subtractDays(now, 1)
    const daysBeforeYesterday = []
    for (let i = 2; i < 8; i++) {
      daysBeforeYesterday.push(subtractDays(now, i))
    }
    return [
      {
        label: `${formatMessage(messages.today)} (${formatDayMonthFunc(now)})`,
        minDate: startOfDay(now),
        maxDate: endOfDay(now),
      },
      {
        label: `${formatMessage(messages.yesterday)} (${formatDayMonthFunc(yesterday)})`,
        minDate: startOfDay(yesterday),
        maxDate: endOfDay(yesterday),
      },
      ...map(daysBeforeYesterday, day => {
        const selectItem = {
          label: formatDate(day, {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
          }),
          minDate: startOfDay(day),
          maxDate: endOfDay(day),
        }
        return selectItem
      }),
    ]
  }

  getWeeksSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage },
    } = this.props
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
    return [
      {
        label: `${formatMessage(messages.last7Days)}`,
        minDate: startOfDay(last7DaysStart),
        maxDate: endOfDay(now),
      },
      {
        label: `${formatMessage(messages.thisWeek)} (${formatDayMonthFunc(thisWeekStart)} - ${formatDayMonthFunc(
          thisWeekEnd
        )})`,
        minDate: thisWeekStart,
        maxDate: thisWeekEnd,
      },
      {
        label: `${formatMessage(messages.lastWeek)} (${formatDayMonthFunc(lastWeekStart)} - ${formatDayMonthFunc(
          lastWeekEnd
        )})`,
        minDate: lastWeekStart,
        maxDate: lastWeekEnd,
      },
      ...map(weeksBeforeLast, dayInWeek => {
        const weekStart = startOfWeek(dayInWeek)
        const weekEnd = endOfWeek(dayInWeek)
        return {
          label: `${formatDayMonthFunc(weekStart)} - ${formatDayMonthFunc(weekEnd)}`,
          minDate: startOfDay(weekStart),
          maxDate: endOfDay(weekEnd),
        }
      }),
    ]
  }

  getMonthsSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
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
    return [
      {
        label: `${formatMessage(messages.last30Days)}`,
        minDate: startOfDay(last30DaysStart),
        maxDate: endOfDay(now),
      },
      {
        label: `${formatMessage(messages.thisMonth)} (${formatDayMonthFunc(thisMonthStart)} - ${formatDayMonthFunc(
          thisMonthEnd
        )})`,
        minDate: thisMonthStart,
        maxDate: thisMonthEnd,
      },
      {
        label: `${formatMessage(messages.lastMonth)} (${formatDayMonthFunc(lastMonthStart)} - ${formatDayMonthFunc(
          lastMonthEnd
        )})`,
        minDate: lastMonthStart,
        maxDate: lastMonthEnd,
      },
      ...map(monthsBeforeLast, dayInMonth => {
        const monthStart = startOfMonth(dayInMonth)
        const monthEnd = endOfMonth(dayInMonth)
        return {
          label: formatDate(monthStart, { month: 'long', year: 'numeric' }),
          minDate: startOfDay(monthStart),
          maxDate: endOfDay(monthEnd),
        }
      }),
    ]
  }

  getQuartersSelectList = () => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
    const now = new Date()
    const thisQuarterStart = startOfQuarter(now)
    const thisQuarterEnd = endOfQuarter(now)
    const previousQuarters = []
    for (let i = 1; i < 12; i++) {
      previousQuarters.push(subtractQuarters(now, i))
    }
    return [
      {
        label: `${formatMessage(messages.thisQuarter)}`,
        minDate: startOfDay(thisQuarterStart),
        maxDate: endOfDay(thisQuarterEnd),
      },
      ...map(previousQuarters, dayInQuarter => {
        const quarterStart = startOfQuarter(dayInQuarter)
        const quarterEnd = endOfQuarter(dayInQuarter)
        return {
          label: `${formatMessage(messages.quarter)} ${getQuarter(dayInQuarter)} ${formatDate(dayInQuarter, {
            year: 'numeric',
          })}`,
          minDate: startOfDay(quarterStart),
          maxDate: endOfDay(quarterEnd),
        }
      }),
    ]
  }

  getYearsSelectList = () => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
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
    return [
      {
        label: `${formatMessage(messages.thisYear)} (${formatDate(thisYearStart, { year: 'numeric' })})`,
        minDate: thisYearStart,
        maxDate: thisYearEnd,
      },
      {
        label: `${formatMessage(messages.lastYear)} (${formatDate(lastYearStart, { year: 'numeric' })})`,
        minDate: lastYearStart,
        maxDate: lastYearEnd,
      },
      ...map(yearsBeforeLast, dayInYear => {
        const yearStart = startOfYear(dayInYear)
        const yearEnd = endOfYear(dayInYear)
        return {
          label: formatDate(yearStart, { year: 'numeric' }),
          minDate: startOfDay(yearStart),
          maxDate: endOfDay(yearEnd),
        }
      }),
    ]
  }

  getMinDate() {
    const { minDate } = this.props
    return minDate && new Date(minDate)
  }

  getMaxDate() {
    const { maxDate } = this.props
    return maxDate && new Date(maxDate)
  }

  handleMaxDateChange = date => {
    this.props.onChangeDate({ maxDate: endOfDay(date).toJSON() })
  }

  handleMinDateChange = date => {
    this.props.onChangeDate({ minDate: date.toJSON() })
  }

  handleDateRangeChange = ({ target: { value } }) => {
    this.props.onChangeDate(
      value ? { minDate: value.minDate.toJSON(), maxDate: value.maxDate.toJSON() } : { minDate: null, maxDate: null }
    )
  }

  handleRangeModeChange = ({ target: { value } }) => {
    this.setState({
      rangeMode: value,
    })
    this.props.onChangeDate({ minDate: null, maxDate: null })
  }

  render() {
    const { intl, floatingLabelText, controlClassName, dateFormat } = this.props
    const { dayMonthFormat } = getAspectDisplayPreferences().toJS()
    const { formatMessage } = intl
    const formatDayMonthFunc = date => format(date, dayMonthFormat)

    const dropDownSelectItems = {
      any: [],
      day: this.getDaysSelectList(formatDayMonthFunc),
      week: this.getWeeksSelectList(formatDayMonthFunc),
      month: this.getMonthsSelectList(formatDayMonthFunc),
      quarter: this.getQuartersSelectList(formatDayMonthFunc),
      year: this.getYearsSelectList(formatDayMonthFunc),
      custom: [],
    }[this.state.rangeMode]

    const dropDownListHintText = {
      any: '',
      day: formatMessage(messages.selectDay),
      week: formatMessage(messages.selectWeek),
      month: formatMessage(messages.selectMonth),
      quarter: formatMessage(messages.selectQuarter),
      year: formatMessage(messages.selectYear),
      custom: '',
    }[this.state.rangeMode]

    const selectedValue = find(dropDownSelectItems, {
      minDate: this.getMinDate(),
      maxDate: this.getMaxDate(),
    })

    const restProps = omit(this.props, [
      'floatingLabelText',
      'controlClassName',
      'clearButtonTooltip',
      'onChangeDate',
      'minDate',
      'maxDate',
      'intl',
    ])
    return (
      <div className={styles.DateRangeSelector}>
        <div className={controlClassName}>
          <SelectField
            className={styles.DateRangeSelector__RangeModeSelector}
            floatingLabelText={floatingLabelText}
            floatingLabelFixed
            hintText={dropDownListHintText}
            value={this.state.rangeMode}
            onChange={this.handleRangeModeChange}
          >
            <MenuItem value="any">{formatMessage(messages.any)}</MenuItem>
            <Divider />
            <MenuItem value="day">{formatMessage(messages.day)}</MenuItem>
            <MenuItem value="week">{formatMessage(messages.week)}</MenuItem>
            <MenuItem value="month">{formatMessage(messages.month)} </MenuItem>
            <MenuItem value="quarter">{formatMessage(messages.quarter)} </MenuItem>
            <MenuItem value="year">{formatMessage(messages.year)}</MenuItem>
            <Divider />
            <MenuItem value="custom">{formatMessage(messages.custom)} </MenuItem>
          </SelectField>
        </div>
        {(() => {
          switch (this.state.rangeMode) {
            case 'any':
              return false
            case 'custom':
              return (
                <div className={styles.DateRangeSelector__DatePickerContainer}>
                  <FormGroup className={controlClassName} label={formatMessage(messages.fromDate)}>
                    <DateTimeInput
                      {...restProps}
                      intl={intl}
                      dateFormat={dateFormat}
                      value={this.getMinDate()}
                      onChange={this.handleMinDateChange}
                    />
                  </FormGroup>
                  <FormGroup className={controlClassName} label={formatMessage(messages.toDate)}>
                    <DateTimeInput
                      {...restProps}
                      intl={intl}
                      dateFormat={dateFormat}
                      value={this.getMaxDate()}
                      onChange={this.handleMaxDateChange}
                    />
                  </FormGroup>
                </div>
              )
            default:
              return (
                <div className={controlClassName}>
                  <SelectField
                    className={styles.DateRangeSelector__DropDownList}
                    floatingLabelText=" "
                    floatingLabelFixed
                    hintText={dropDownListHintText}
                    value={selectedValue}
                    onChange={this.handleDateRangeChange}
                  >
                    {dropDownSelectItems.map(dropDownSelectItem => (
                      <MenuItem
                        key={`${dropDownSelectItem.minDate.getTime()}-${dropDownSelectItem.maxDate.getTime()}`}
                        value={dropDownSelectItem}
                      >
                        {dropDownSelectItem.label}
                      </MenuItem>
                    ))}
                  </SelectField>
                </div>
              )
          }
        })()}
      </div>
    )
  }
}

export default injectIntl(DateRangeSelector)
