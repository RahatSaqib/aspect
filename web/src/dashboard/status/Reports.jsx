import classnames from 'classnames/bind'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { compose, pure, withProps } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import subtractDays from 'date-fns/subDays'
import formatDate from 'date-fns/format'
import config from '../../config'
import { getAspectAccess } from '../../globals/sideEffects/LocalStorage'

import Title from './Title'
import Icon from '../../components/shared/icon/Icon'
import {
  requirePermissions,
  isEnabledFeature,
} from '../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    features: ['reportDashboard'],
  }),
  connect(state => ({ userFeatures: state.user.features })),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    const now = new Date()
    const last7Days = formatDate(subtractDays(now, 7), 'YYYY-MM-DD')
    const last30Days = formatDate(subtractDays(now, 30), 'YYYY-MM-DD')
    const beginningOfYear = formatDate(
      new Date(new Date().getFullYear(), 0, 1),
      'YYYY-MM-DD'
    )
    return {
      showHigherLevel: _.isEmpty(filtersParams.get('siteId')),
      token: getAspectAccess(),
      siteId: filtersParams.get('siteId'),
      last7Days,
      last30Days,
      beginningOfYear,
    }
  })
)

export const Reports = ({
  className,
  title,
  siteId,
  last7Days,
  last30Days,
  beginningOfYear,
  // --- injected by recompose ---
  showHigherLevel,
  userFeatures,
  token,
}) =>
  (showHigherLevel &&
    isEnabledFeature(userFeatures, ['targetDashboard']) && (
      <Card className={className}>
        <div className={cssClasses('TitleContainer')}>
          <Title
            title={title}
            icon={
              <Icon
                className={cssClasses('Title__Icon')}
                type={require('../../components/shared/icon/assets/reports.svg')}
              />
            }
          />
        </div>
        <div className={cssClasses('ReportsContainer')}>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/RifResistanceExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
          >
            Rif Report (last 7 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/MtbPositiveExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
          >
            MTB+ Report (last 7 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/IndeterminateExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
          >
            TI Report (last 7 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/FailedTestsReportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
          >
            Failed Test Report (last 7 days)
          </Button>
        </div>
        <div className={cssClasses('ReportsContainer')}>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/RifResistanceExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
          >
            Rif Report (last 30 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/MtbPositiveExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
          >
            MTB+ Report (last 30 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/IndeterminateExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
          >
            TI Report (last 30 days)
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/FailedTestsReportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
          >
            Failed Test Report (last 30 days)
          </Button>
        </div>
        <div className={cssClasses('ReportsContainer')}>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${
              config.aspectApi
            }/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfYear}&token=${token}`}
          >
            Quarterly Report
          </Button>
        </div>
      </Card>
    )) || (
    <Card className={className}>
      <div className={cssClasses('TitleContainer')}>
        <Title
          title={title}
          icon={
            <Icon
              className={cssClasses('Title__Icon')}
              type={require('../../components/shared/icon/assets/reports.svg')}
            />
          }
        />
      </div>
      <div className={cssClasses('ReportsContainer')}>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${
            config.aspectApi
          }/report/gx/LogsExportExcel.xlsx?dateFrom=${last30Days}&siteId=${siteId}&token=${token}`}
        >
          Inventory Report
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${
            config.aspectApi
          }/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfYear}&siteId=${siteId}&token=${token}`}
        >
          Quarterly Report
        </Button>
      </div>
    </Card>
  )

export default enhance(Reports)
