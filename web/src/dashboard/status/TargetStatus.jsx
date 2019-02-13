import _fp from 'lodash/fp'
import classnames from 'classnames/bind'
import React from 'react'

import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subtractMonths from 'date-fns/subMonths'
import endOfQuarter from 'date-fns/endOfQuarter'
import startOfQuarter from 'date-fns/startOfQuarter'
import subtractQuarters from 'date-fns/subQuarters'
import subtractYears from 'date-fns/subYears'
import endOfYear from 'date-fns/endOfYear'
import startOfYear from 'date-fns/startOfYear'

import { bindActionCreators } from 'redux'
import { compose, lifecycle, pure, withHandlers, withProps } from 'recompose'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'
import { Unit } from '../../components/pureGrids'
import { fetchTargetDashboard } from '../DashboardRedux'
import Title from './Title'
import Icon from '../../components/shared/icon/Icon'
import TemperatureGauge from '../../components/graph/TemperatureGauge'
import StyledDropdown from '../../components/shared/StyledDropdown'
import { mergeToFiltersParams } from '../../filter/utils'
import requirePermissions from '../../components/shared/requirePermissions'

import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const DEFAULT_DATE_RANGE_VALUE = 'lastMonth'
const DEFAULT_DATE_RANGE = _fp.mapValues(
  d => d.toJSON(),
  recaculateDateRanges()[DEFAULT_DATE_RANGE_VALUE]
)

const defaultFilters = rawFiltersParams =>
  rawFiltersParams.has('minDate')
    ? rawFiltersParams
    : mergeToFiltersParams(DEFAULT_DATE_RANGE, rawFiltersParams)

const filtersFromLocation = _fp.flowRight(
  defaultFilters,
  searchParams => new URLSearchParams(searchParams.get('filters') || '')
)

function recaculateDateRanges(now = new Date()) {
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const thisYearStart = startOfYear(now)
  const thisYearEnd = endOfYear(now)
  const lastYearStart = subtractYears(thisYearStart, 1)
  const lastYearEnd = subtractYears(thisYearEnd, 1)
  const thisQuarterStart = startOfQuarter(now)
  const thisQuarterEnd = endOfQuarter(now)

  const lastMonth = subtractMonths(now, 1)
  const lastMonthStart = startOfMonth(lastMonth)
  const lastMonthEnd = endOfMonth(lastMonth)
  const lastQuarter = subtractQuarters(now, 1)
  const lastQuarterStart = startOfQuarter(lastQuarter)
  const lastQuarterEnd = endOfQuarter(lastQuarter)

  return {
    thisYear: {
      minDate: thisYearStart,
      maxDate: thisYearEnd,
    },
    lastYear: {
      minDate: lastYearStart,
      maxDate: lastYearEnd,
    },
    thisQuarter: {
      minDate: thisQuarterStart,
      maxDate: thisQuarterEnd,
    },
    lastQuarter: {
      minDate: lastQuarterStart,
      maxDate: lastQuarterEnd,
    },
    thisMonth: {
      minDate: thisMonthStart,
      maxDate: thisMonthEnd,
    },
    lastMonth: {
      minDate: startOfDay(lastMonthStart),
      maxDate: endOfDay(lastMonthEnd),
    },
  }
}

const enhance = compose(
  pure,
  requirePermissions({
    features: ['targetDashboard'],
  }),
  connect(
    state => ({
      targetSummaryList: state.dashboard.targetSummaryList,
    }),
    bindActionCreators.bind(null, {
      fetchTargetDashboard,
    })
  ),
  withProps(({ intl: { formatMessage }, location }) => {
    const dateRanges = recaculateDateRanges()
    const dateRangeList = [
      'thisYear',
      'lastYear',
      'thisQuarter',
      'lastQuarter',
      'thisMonth',
      'lastMonth',
    ].map(range => ({
      value: range,
      label: `${formatMessage(messages[range])}`,
      minDate: dateRanges[range].minDate,
      maxDate: dateRanges[range].maxDate,
    }))
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = filtersFromLocation(searchParams)

    const dateRange = _fp.find(
      {
        minDate: new Date(filtersParams.get('minDate')),
        maxDate: new Date(filtersParams.get('maxDate')),
      },
      dateRangeList
    )

    return {
      isShow: _fp.isEmpty(filtersParams.get('siteId')),
      dateRange: !dateRange ? DEFAULT_DATE_RANGE_VALUE : dateRange.value,
      dateRangeList,
    }
  }),
  withHandlers({
    onInitialLoad: ({ location, fetchTargetDashboard }) => () => {
      const filtersParams = filtersFromLocation(
        new URLSearchParams(location.search)
      )
      fetchTargetDashboard(filtersParams)
    },
    onDateRangeClick: ({ history, location, dateRangeList }) => ({
      target: { value: dateRange },
    }) => {
      const selectedValue = _fp.find(
        {
          value: dateRange,
        },
        dateRangeList
      )
      const nextFilters = {
        minDate: selectedValue.minDate.toJSON(),
        maxDate: selectedValue.maxDate.toJSON(),
      }

      const searchParams = new URLSearchParams(location.search)
      const filtersParams = mergeToFiltersParams(
        nextFilters,
        new URLSearchParams(searchParams.get('filters') || '')
      )
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const TargetStatus = ({
  intl,
  // --- injected by recompose ---
  isShow,
  className,
  title,
  targetSummaryList,
  dateRange,
  dateRangeList,
  onDateRangeClick,
}) => {
  const hasError = target =>
    parseFloat(target.get('dataCollection')) <
    parseFloat(target.get('thresholdPercentageDataCollection'))

  const getProgressValue = target =>
    `${Math.round(target.get('count') / target.get('target') * 100)}%`

  return (
    isShow &&
    targetSummaryList.size > 0 &&
    targetSummaryList.some(v => v.get('target')) && (
      <Card className={className}>
        <div className={cssClasses('TitleContainer')}>
          <Title
            title={title}
            icon={
              <Icon
                className={cssClasses('Title__Icon')}
                type={require('../../components/shared/icon/assets/data.svg')}
              />
            }
          />
          <div
            className={cssClasses(
              'FiltersGroup__Child',
              'FiltersGroup__Child--dropdown'
            )}
          >
            <StyledDropdown
              value={dateRange}
              source={dateRangeList}
              onChange={onDateRangeClick}
            />
          </div>
        </div>
        <div
          className={cssClasses(
            'TargetItemBlockContainer--horizontal-scrollable'
          )}
        >
          <div className={cssClasses('TargetItemBlockContainer')}>
            {targetSummaryList.map(target => (
              <Unit
                xs="1-4"
                sm="1-4"
                key={target.get('id')}
                className={cssClasses('TargetItemBlock')}
              >
                <div className={cssClasses('TargetItemBlock__Title')}>
                  {target.get('title')}
                </div>
                <div className={cssClasses('TargetItemBlock__Label')}>
                  <span className={cssClasses('TargetItemBlock__Label--sub')}>
                    {intl.formatMessage(messages.targetLabel)}
                  </span>
                  {target.get('target')}
                </div>
                <div className={cssClasses('TargetItemBlock__Graph')}>
                  <TemperatureGauge
                    goal={target.get('target')}
                    value={target.get('count')}
                  />
                </div>
                <div className={cssClasses('TargetItemBlock__Label')}>
                  <span className={cssClasses('TargetItemBlock__Label--sub')}>
                    {intl.formatMessage(messages.targetProgressLabel)}
                  </span>
                  {getProgressValue(target)}
                </div>
                <div className={cssClasses('TargetItemBlock__Label--error')}>
                  {hasError(target) &&
                    intl.formatMessage(
                      messages.targetErrorMessageLabel,
                      target.toJS()
                    )}
                </div>
              </Unit>
            ))}
          </div>
        </div>
      </Card>
    )
  )
}

export default enhance(TargetStatus)
