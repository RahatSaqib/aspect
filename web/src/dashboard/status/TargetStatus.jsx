import _fp from 'lodash/fp'
import classnames from 'classnames/bind'
import React from 'react'

import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import startOfMonth from 'date-fns/startOfMonth'
import subtractMonths from 'date-fns/subMonths'
import endOfYear from 'date-fns/endOfYear'
import startOfYear from 'date-fns/startOfYear'

import { bindActionCreators } from 'redux'
import { compose, lifecycle, pure, withHandlers, withProps } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import { Unit } from '../../components/pureGrids'
import { fetchTargetDashboard } from '../DashboardRedux'
import Title from './Title'
import TemperatureGauge from '../../components/graph/TemperatureGauge'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const DEFAULT_DATE_RANGE = {
  minDate: startOfYear(new Date()).toJSON(),
  maxDate: endOfYear(new Date()).toJSON(),
}

const enhance = compose(
  pure,
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
    const lastMonth = subtractMonths(now, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)
    const dateRangeList = [
      {
        key: 'thisYear',
        label: `${formatMessage(messages.thisYear)}`,
        minDate: thisYearStart,
        maxDate: thisYearEnd,
      },
      {
        key: 'thisMonth',
        label: `${formatMessage(messages.thisMonth)}`,
        minDate: thisMonthStart,
        maxDate: thisMonthEnd,
      },
      {
        key: 'lastMonth',
        label: `${formatMessage(messages.lastMonth)}`,
        minDate: startOfDay(lastMonthStart),
        maxDate: endOfDay(lastMonthEnd),
      },
    ]
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(
      searchParams.get('filters') || DEFAULT_DATE_RANGE
    )
    const dateRange = _fp.find(
      {
        minDate: new Date(filtersParams.get('minDate')),
        maxDate: new Date(filtersParams.get('maxDate')),
      },
      dateRangeList
    )
    return {
      dateRange: !dateRange ? 'thisYear' : dateRange.key,
      dateRangeList,
    }
  }),
  withHandlers({
    onInitialLoad: ({ location, fetchTargetDashboard }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || DEFAULT_DATE_RANGE
      )
      fetchTargetDashboard(filtersParams)
    },
    onDateRangeClick: ({ history, location, dateRangeList }) => ({
      currentTarget: { dataset: { dateRange } },
    }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || DEFAULT_DATE_RANGE
      )

      const selectedValue = _fp.find(
        {
          key: dateRange,
        },
        dateRangeList
      )

      filtersParams.set('minDate', selectedValue.minDate.toJSON())
      filtersParams.set('maxDate', selectedValue.maxDate.toJSON())
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
  className,
  title,
  targetSummaryList,
  dateRange,
  dateRangeList,
  onDateRangeClick,
}) => {
  const hasError = target =>
    parseFloat(target.get('extra')) < parseFloat(target.get('threshold'))

  const getGoalValue = target =>
    dateRange === 'thisYear'
      ? target.get('target')
      : Math.round(target.get('target') / 12)

  return (
    targetSummaryList.size > 0 && (
      <Card className={className}>
        <div className={cssClasses('TitleContainer')}>
          <Title
            colorClassName={cssClasses('Title__Color--status')}
            title={title}
          />
          <div>
            {_fp.map(
              date => (
                <Button
                  className={cssClasses('Title__FiltersGroup__Button')}
                  primary
                  raised
                  inverse={date.key !== dateRange}
                  label={date.label}
                  data-date-range={date.key}
                  onClick={onDateRangeClick}
                />
              ),
              dateRangeList
            )}
          </div>
        </div>
        <div className={cssClasses('Section--summary')}>
          {targetSummaryList.map(target => (
            <Unit sm="1-2" lg="1-4" className={cssClasses('TargetItemBlock')}>
              <div className={cssClasses('TargetItemBlock__Title')}>
                {target.get('title')}
              </div>
              <div className={cssClasses('TargetItemBlock__Label')}>
                <span className={cssClasses('TargetItemBlock__Label--sub')}>
                  {intl.formatMessage(messages.targetGoalLabel)}
                </span>
                {target.get('count')}
              </div>
              <div className={cssClasses('TargetItemBlock__Graph')}>
                <TemperatureGauge
                  goal={getGoalValue(target)}
                  value={target.get('count')}
                  hasError={hasError(target)}
                />
              </div>
              <div className={cssClasses('TargetItemBlock__Label')}>
                <span className={cssClasses('TargetItemBlock__Label--sub')}>
                  {intl.formatMessage(messages.targetCurrentLabel)}
                </span>
                {getGoalValue(target)}
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
