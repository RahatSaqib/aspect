import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import { compose, lifecycle, withHandlers } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import { Unit } from '../../components/pureGrids'
import { fetchTargetDashboard } from '../DashboardRedux'
import Title from './Title'
import TemperatureGauge from '../../components/graph/TemperatureGauge'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  connect(
    state => ({
      targetSummaryList: state.dashboard.targetSummaryList,
    }),
    bindActionCreators.bind(null, {
      fetchTargetDashboard,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchTargetDashboard }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      fetchTargetDashboard(filtersParams)
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

const hasError = target =>
  parseFloat(target.get('extra')) < parseFloat(target.get('threshold'))

export const TargetStatus = ({
  intl,
  // --- injected by recompose ---
  className,
  title,
  targetSummaryList,
}) => (
  <Card className={className}>
    <div className={cssClasses('TitleContainer')}>
      <Title
        colorClassName={cssClasses('Title__Color--status')}
        title={title}
      />
      <div>
        <Button
          className={cssClasses('Title__FiltersGroup__Button')}
          primary
          raised
          inverse={false}
          label={intl.formatMessage(messages.thisYear)}
          data-date-range="30"
        />
        <Button
          className={cssClasses('Title__FiltersGroup__Button')}
          primary
          raised
          inverse
          label={intl.formatMessage(messages.thisMonth)}
          data-date-range="30"
        />
        <Button
          className={cssClasses('Title__FiltersGroup__Button')}
          primary
          raised
          inverse
          label={intl.formatMessage(messages.lastMonth)}
          data-date-range="30"
        />
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
              goal={target.get('target')}
              value={target.get('count')}
              hasError={hasError(target)}
            />
          </div>
          <div className={cssClasses('TargetItemBlock__Label')}>
            <span className={cssClasses('TargetItemBlock__Label--sub')}>
              {intl.formatMessage(messages.targetCurrentLabel)}
            </span>
            {target.get('target')}
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

export default enhance(TargetStatus)
