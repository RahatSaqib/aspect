import React, { PureComponent } from 'react'
import { Divider, MenuItem } from '@mui/material'
import differenceInMonths from 'date-fns/differenceInMonths'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import endOfQuarter from 'date-fns/endOfQuarter'
import endOfWeek from 'date-fns/endOfWeek'
import endOfYear from 'date-fns/endOfYear'
import format from 'date-fns/format'
import getQuarter from 'date-fns/getQuarter'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfQuarter from 'date-fns/startOfQuarter'
import startOfWeek from 'date-fns/startOfWeek'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import subtractMonths from 'date-fns/subMonths'
import subtractQuarters from 'date-fns/subQuarters'
import subtractWeeks from 'date-fns/subWeeks'
import subtractYears from 'date-fns/subYears'
import find from 'lodash/find'
import map from 'lodash/map'
import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import { injectIntl } from 'react-intl'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
import PropTypeOf from '../../../utils/types'
import DateTimeInput from '../../shared/DateTimeInput'
import SelectField from '../../shared/SelectField'
import FormGroup from '../../themedReactToolbox/FormGroup'
import styles from './DateRangeSelector.css'
import messages from './messages'

export class DateRangeSelector extends PureComponent {
  static propTypes = {
    intl: PropTypeOf.intl.isRequired,
    onChangeDate: PropTypes.func.isRequired,
    floatingLabelText: PropTypes.string.isRequired,
    controlClassName: PropTypes.string.isRequired,
    minDate: PropTypes.any,
    maxDate: PropTypes.any,
    dateFormat: PropTypes.string,
    minFilterName: PropTypes.string,
    maxFilterName: PropTypes.string,
    maxDateTo: PropTypes.any,
    enableDayFilter: PropTypes.bool,
    enableYearFilter: PropTypes.bool,
    enableMonthFilter: PropTypes.bool,
    enableQuarterFilter: PropTypes.bool,
    enableWeekFilter: PropTypes.bool,
  }

  static defaultProps = {
    minDate: null,
    maxDate: null,
    dateFormat: 'yyyy-MM-dd',
    minFilterName: 'minDate',
    maxFilterName: 'maxDate',
    maxDateTo: new Date(),
    enableDayFilter: true,
    enableYearFilter: true,
    enableMonthFilter: true,
    enableQuarterFilter: true,
    enableWeekFilter: true,
  }

  state = {
    rangeMode: 'any',
  }

  getDaysSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
    const dateFrom = new Date()
    const yesterday = subtractDays(dateFrom, 1)
    const daysBeforeYesterday = []
    for (let i = 2; i < 8; i++) {
      daysBeforeYesterday.push(subtractDays(dateFrom, i))
    }
    return [
      {
        label: `${formatMessage(messages.today)} (${formatDayMonthFunc(dateFrom)})`,
        ...this.getDateRange(startOfDay(dateFrom), endOfDay(dateFrom)),
      },
      {
        label: `${formatMessage(messages.yesterday)} (${formatDayMonthFunc(yesterday)})`,
        ...this.getDateRange(startOfDay(yesterday), endOfDay(yesterday)),
      },
      ...map(daysBeforeYesterday, day => {
        const selectItem = {
          label: formatDate(day, {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
          }),
          ...this.getDateRange(startOfDay(day), endOfDay(day)),
        }
        return selectItem
      }),
    ]
  }

  getWeeksSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage },
    } = this.props
    const dateFrom = new Date()
    const last7DaysStart = subtractDays(dateFrom, 7)
    const thisWeekStart = startOfWeek(dateFrom)
    const thisWeekEnd = endOfWeek(dateFrom)
    const lastWeek = subtractWeeks(dateFrom, 1)
    const lastWeekStart = startOfWeek(lastWeek)
    const lastWeekEnd = endOfWeek(lastWeek)
    const weeksBeforeLast = []
    for (let i = 2; i < 8; i++) {
      weeksBeforeLast.push(subtractWeeks(dateFrom, i))
    }
    return [
      {
        label: `${formatMessage(messages.last7Days)}`,
        ...this.getDateRange(startOfDay(last7DaysStart), endOfDay(dateFrom)),
      },
      {
        label: `${formatMessage(messages.thisWeek)} (${formatDayMonthFunc(thisWeekStart)} - ${formatDayMonthFunc(
          thisWeekEnd
        )})`,
        ...this.getDateRange(thisWeekStart, thisWeekEnd),
      },
      {
        label: `${formatMessage(messages.lastWeek)} (${formatDayMonthFunc(lastWeekStart)} - ${formatDayMonthFunc(
          lastWeekEnd
        )})`,
        ...this.getDateRange(lastWeekStart, lastWeekEnd),
      },
      ...map(weeksBeforeLast, dayInWeek => {
        const weekStart = startOfWeek(dayInWeek)
        const weekEnd = endOfWeek(dayInWeek)
        return {
          label: `${formatDayMonthFunc(weekStart)} - ${formatDayMonthFunc(weekEnd)}`,
          ...this.getDateRange(startOfDay(weekStart), endOfDay(weekEnd)),
        }
      }),
    ]
  }

  getMonthsSelectList = formatDayMonthFunc => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props
    const dateFrom = new Date()
    const last30DaysStart = subtractDays(dateFrom, 30)
    const thisMonthStart = startOfMonth(dateFrom)
    const thisMonthEnd = endOfMonth(dateFrom)
    const lastMonth = subtractMonths(dateFrom, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)
    const monthsBeforeLast = []
    for (let i = 2; i < 12; i++) {
      monthsBeforeLast.push(subtractMonths(dateFrom, i))
    }
    return [
      {
        label: `${formatMessage(messages.last30Days)}`,
        ...this.getDateRange(startOfDay(last30DaysStart), endOfDay(dateFrom)),
      },
      {
        label: `${formatMessage(messages.thisMonth)} (${formatDayMonthFunc(thisMonthStart)} - ${formatDayMonthFunc(
          thisMonthEnd
        )})`,
        ...this.getDateRange(thisMonthStart, thisMonthEnd),
      },
      {
        label: `${formatMessage(messages.lastMonth)} (${formatDayMonthFunc(lastMonthStart)} - ${formatDayMonthFunc(
          lastMonthEnd
        )})`,
        ...this.getDateRange(lastMonthStart, lastMonthEnd),
      },
      ...map(monthsBeforeLast, dayInMonth => {
        const monthStart = startOfMonth(dayInMonth)
        const monthEnd = endOfMonth(dayInMonth)
        return {
          label: formatDate(monthStart, { month: 'long', year: 'numeric' }),
          ...this.getDateRange(startOfDay(monthStart), endOfDay(monthEnd)),
        }
      }),
    ]
  }

  getQuartersSelectList = () => {
    const {
      intl: { formatMessage, formatDate },
    } = this.props

    const dateFrom = new Date()
    const thisQuarterStart = startOfQuarter(dateFrom)
    const thisQuarterEnd = endOfQuarter(dateFrom)
    const previousQuarters = []
    for (let i = 1; i < 12; i++) {
      previousQuarters.push(subtractQuarters(dateFrom, i))
    }
    return [
      {
        label: `${formatMessage(messages.thisQuarter)}`,
        ...this.getDateRange(startOfDay(thisQuarterStart), endOfDay(thisQuarterEnd)),
      },
      ...map(previousQuarters, dayInQuarter => {
        const quarterStart = startOfQuarter(dayInQuarter)
        const quarterEnd = endOfQuarter(dayInQuarter)
        return {
          label: `${formatMessage(messages.quarter)} ${getQuarter(dayInQuarter)} ${formatDate(dayInQuarter, {
            year: 'numeric',
          })}`,
          ...this.getDateRange(startOfDay(quarterStart), endOfDay(quarterEnd)),
        }
      }),
    ]
  }

  getYearsSelectList = () => {
    const {
      intl: { formatMessage, formatDate },
      maxDateTo,
    } = this.props
    const now = maxDateTo
    const notShowTitles = differenceInMonths(now, new Date()) > 0
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
        label: `${notShowTitles ? '' : `${formatMessage(messages.thisYear)} (`}${formatDate(thisYearStart, {
          year: 'numeric',
        })}${notShowTitles ? '' : ')'}`,
        ...this.getDateRange(thisYearStart, thisYearEnd),
      },
      {
        label: `${notShowTitles ? '' : `${formatMessage(messages.lastYear)} (`}${formatDate(lastYearStart, {
          year: 'numeric',
        })}${notShowTitles ? '' : ')'}`,
        ...this.getDateRange(lastYearStart, lastYearEnd),
      },
      ...map(yearsBeforeLast, dayInYear => {
        const yearStart = startOfYear(dayInYear)
        const yearEnd = endOfYear(dayInYear)
        return {
          label: formatDate(yearStart, { year: 'numeric' }),
          ...this.getDateRange(startOfDay(yearStart), endOfDay(yearEnd)),
        }
      }),
    ]
  }

  getMinDateFilterName() {
    const { minFilterName } = this.props
    return minFilterName
  }

  getMaxDateFilterName() {
    const { maxFilterName } = this.props
    return maxFilterName
  }

  getMinDate() {
    const minDate = this.props[this.getMinDateFilterName()]
    return minDate && new Date(minDate)
  }

  getMaxDate() {
    const maxDate = this.props[this.getMaxDateFilterName()]

    return maxDate && new Date(maxDate)
  }

  getDateRange(minDate, maxDate) {
    const values = {}
    if (minDate) values[this.getMinDateFilterName()] = minDate
    if (maxDate) values[this.getMaxDateFilterName()] = maxDate
    return values
  }

  handleMaxDateChange = date => {
    this.props.onChangeDate(this.getDateRange(null, endOfDay(date).toJSON()))
  }

  handleMinDateChange = date => {
    this.props.onChangeDate(this.getDateRange(date.toJSON()))
  }

  handleDateRangeChange = ({ target: { value } }) => {
    this.props.onChangeDate(
      value
        ? this.getDateRange(value[this.getMinDateFilterName()].toJSON(), value[this.getMaxDateFilterName()].toJSON())
        : this.getDateRange()
    )
  }

  handleRangeModeChange = ({ target: { value } }) => {
    this.setState({
      rangeMode: value,
    })
    this.props.onChangeDate(this.getDateRange())
  }

  render() {
    const {
      intl,
      floatingLabelText,
      controlClassName,
      dateFormat,
      enableDayFilter,
      enableMonthFilter,
      enableWeekFilter,
      enableQuarterFilter,
      enableYearFilter,
    } = this.props
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
    const selectedValue = find(dropDownSelectItems, this.getDateRange(this.getMinDate(), this.getMaxDate()))

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
            {enableDayFilter && <MenuItem value="day">{formatMessage(messages.day)}</MenuItem>}
            {enableWeekFilter && <MenuItem value="week">{formatMessage(messages.week)}</MenuItem>}
            {enableMonthFilter && <MenuItem value="month">{formatMessage(messages.month)} </MenuItem>}
            {enableQuarterFilter && <MenuItem value="quarter">{formatMessage(messages.quarter)} </MenuItem>}
            {enableYearFilter && <MenuItem value="year">{formatMessage(messages.year)}</MenuItem>}
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
                        key={`${dropDownSelectItem[this.getMinDateFilterName()].getTime()}-${dropDownSelectItem[
                          this.getMaxDateFilterName()
                        ].getTime()}`}
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
