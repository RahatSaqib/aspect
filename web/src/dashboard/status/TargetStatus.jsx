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
import endOfYear from 'date-fns/endOfYear'
import startOfYear from 'date-fns/startOfYear'
import subtractYears from 'date-fns/subYears'

import { bindActionCreators } from 'redux'
import { compose, lifecycle, pure, withHandlers, withProps } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { Unit } from '../../components/pureGrids'
import { fetchTargetDashboard } from '../DashboardRedux'
import Title from './Title'
import Icon from '../../components/shared/icon/Icon'
import TemperatureGauge from '../../components/graph/TemperatureGauge'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'
import { mergeToFiltersParams } from '../../filter/utils'
import requirePermissions from '../../components/shared/requirePermissions'

import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const DEFAULT_DATE_RANGE = {
  minDate: startOfYear(new Date()).toJSON(),
  maxDate: endOfYear(new Date()).toJSON(),
}

const defaultFilters = rawFiltersParams =>
  rawFiltersParams.has('minDate')
    ? rawFiltersParams
    : mergeToFiltersParams(DEFAULT_DATE_RANGE, rawFiltersParams)

const filtersFromLocation = _fp.flowRight(
  defaultFilters,
  searchParams => new URLSearchParams(searchParams.get('filters') || '')
)

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
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const thisYearStart = startOfYear(now)
    const thisYearEnd = endOfYear(now)
    const thisQuarterStart = startOfQuarter(now)
    const thisQuarterEnd = endOfQuarter(now)

    const lastMonth = subtractMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)
    const lastYear = subtractYears(now, 1)
    const lastYearStart = startOfYear(lastYear)
    const lastYearnEnd = endOfYear(lastYear)
    const lastQuarter = subtractQuarters(now, 1)
    const lastQuarterStart = startOfQuarter(lastQuarter)
    const lastQuarterEnd = endOfQuarter(lastQuarter)

    const dateRangeList = [
      {
        value: 'thisYear',
        label: `${formatMessage(messages.thisYear)}`,
        minDate: thisYearStart,
        maxDate: thisYearEnd,
      },
      {
        value: 'lastYear',
        label: `${formatMessage(messages.lastYear)}`,
        minDate: lastYearStart,
        maxDate: lastYearnEnd,
      },
      {
        value: 'thisQuarter',
        label: `${formatMessage(messages.thisQuarter)}`,
        minDate: thisQuarterStart,
        maxDate: thisQuarterEnd,
      },
      {
        value: 'lastQuarter',
        label: `${formatMessage(messages.lastQuarter)}`,
        minDate: lastQuarterStart,
        maxDate: lastQuarterEnd,
      },
      {
        value: 'thisMonth',
        label: `${formatMessage(messages.thisMonth)}`,
        minDate: thisMonthStart,
        maxDate: thisMonthEnd,
      },
      {
        value: 'lastMonth',
        label: `${formatMessage(messages.lastMonth)}`,
        minDate: startOfDay(lastMonthStart),
        maxDate: endOfDay(lastMonthEnd),
      },
    ]
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
      dateRange: !dateRange ? 'thisYear' : dateRange.value,
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
    onDateRangeClick: ({ history, location, dateRangeList }) => dateRange => {
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
    targetSummaryList.size > 0 && (
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
          className={cssClasses('Section--summary', 'TargetItemBlockContainer')}
        >
          {targetSummaryList.map(target => (
            <Unit
              xs="1-5"
              sm="1-5"
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
                  hasError={hasError(target)}
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
      </Card>
    )
  )
}

export default enhance(TargetStatus)
