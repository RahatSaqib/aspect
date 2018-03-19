import _fp from 'lodash/fp'
import classnames from 'classnames/bind'
import React from 'react'
import Immutable from 'immutable'
import { bindActionCreators } from 'redux'
import { compose, lifecycle, withProps, pure } from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import { Unit } from '../../components/pureGrids'
import Title from './Title'
import TemperatureGauge from '../../components/graph/TemperatureGauge'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const targetSummaryList = Immutable.fromJS([
  {
    id: 1,
    icon: 'place',
    title: 'Sites',
    titleI18nKey: 'sitesTitle',
    subTitle: null,
    subTitleI18nKey: null,
    sqlForStatUnit: null,
    statUnit: null,
    statUnitI18nKey: null,
    statStatus: null,
    statStatusI18nKey: null,
    sqlForExtra: null,
    extraUnit: null,
    extraUnitI18nKey: null,
    extraLabel: null,
    extraLabelI18nKey: null,
    indicator: 0,
    coloredIndicator: 0,
    link: '/browse/site',
    count: 24,
    target: 100,
  },
  {
    id: 2,
    icon: 'computer',
    title: 'Devices',
    titleI18nKey: 'devicesTitle',
    subTitle: null,
    subTitleI18nKey: null,
    sqlForStatUnit: null,
    statUnit: null,
    statUnitI18nKey: null,
    statStatus: null,
    statStatusI18nKey: null,
    sqlForExtra: null,
    extraUnit: null,
    extraUnitI18nKey: null,
    extraLabel: null,
    extraLabelI18nKey: null,
    indicator: 0,
    coloredIndicator: 0,
    link: '/browse/device',
    count: 48,
    target: 100,
  },
  {
    id: 3,
    icon: 'assignment',
    title: 'Results',
    titleI18nKey: 'resultsTitle',
    subTitle: 'Last 30 Days',
    subTitleI18nKey: 'subResultsTitle',
    sqlForStatUnit: null,
    statUnit: null,
    statUnitI18nKey: null,
    statStatus: null,
    statStatusI18nKey: null,
    sqlForExtra: null,
    extraUnit: null,
    extraUnitI18nKey: null,
    extraLabel: null,
    extraLabelI18nKey: null,
    indicator: 0,
    coloredIndicator: 0,
    link: '/browse/result',
    count: 158,
    target: 100,
  },
  {
    id: 4,
    icon: 'perm-identity',
    title: 'Contacts',
    titleI18nKey: 'personTitle',
    subTitle: null,
    subTitleI18nKey: null,
    sqlForStatUnit: null,
    statUnit: null,
    statUnitI18nKey: null,
    statStatus: null,
    statStatusI18nKey: null,
    sqlForExtra: null,
    extraUnit: null,
    extraUnitI18nKey: null,
    extraLabel: null,
    extraLabelI18nKey: null,
    indicator: 0,
    coloredIndicator: 0,
    link: '/browse/person',
    count: 33,
    target: 100,
  },
])
const enhance = _fp.identity

export const TargetStatus = ({
  intl,
  // --- injected by recompose ---
  className,
  title,
}) => (
  <Card className={className}>
    <div className={cssClasses('TitleContainer')}>
      <Title
        colorClassName={cssClasses('Title__Color--status')}
        title={title}
      />
      <div className={cssClasses('FiltersGroup')}>
        <Button
          className={cssClasses('Button')}
          primary
          raised
          label={intl.formatMessage(messages.thisYear)}
          data-date-range="30"
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
          label={intl.formatMessage(messages.thisMonth)}
          data-date-range="30"
        />
        <Button
          className={cssClasses('Button')}
          primary
          raised
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
            <span className={cssClasses('TargetItemBlock__Label__Sub')}>
              {intl.formatMessage(messages.targetGoalLabel)}
            </span>
            {target.get('count')}
          </div>
          <div className={cssClasses('TargetItemBlock__Graph')}>
            <TemperatureGauge
              goal={target.get('target')}
              value={target.get('count')}
            />
          </div>
          <div className={cssClasses('TargetItemBlock__Label')}>
            <span className={cssClasses('TargetItemBlock__Label__Sub')}>
              {intl.formatMessage(messages.targetCurrentLabel)}
            </span>
            {target.get('target')}
          </div>
        </Unit>
      ))}
    </div>
  </Card>
)

export default enhance(TargetStatus)
