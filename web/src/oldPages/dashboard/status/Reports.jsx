import React from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import classnames from 'classnames/bind'
import endOfYear from 'date-fns/endOfYear'
import formatDate from 'date-fns/format'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import subtractYears from 'date-fns/subYears'
import isEmpty from 'lodash/isEmpty'
import { compose, pure, withProps } from 'recompose'
import config from '../../../config'
import Icon from '../../../oldComponents/shared/icon/Icon'
import { requirePermissions } from '../../../oldComponents/shared/requirePermissions'
import { getAspectAccess } from '../../../utils/LocalStorage'
import styles from './index.css'
import Title from './Title'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['dashboard:report'],
  }),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location && location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    const now = new Date()
    const last7Days = formatDate(subtractDays(now, 7), 'yyyy-MM-dd')
    const last30Days = formatDate(subtractDays(now, 30), 'yyyy-MM-dd')
    const beginningOfThisYear = formatDate(startOfYear(now), 'yyyy-MM-dd')
    const endOfThisYear = formatDate(endOfYear(now), 'yyyy-MM-dd')
    const beginningOfLastYear = formatDate(startOfYear(subtractYears(now, 1)), 'yyyy-MM-dd')
    const endOfLastYear = formatDate(endOfYear(subtractYears(now, 1)), 'yyyy-MM-dd')
    return {
      showHigherLevel: isEmpty(filtersParams.get('siteId')),
      token: getAspectAccess(),
      siteId: filtersParams.get('siteId'),
      last7Days,
      last30Days,
      beginningOfThisYear,
      endOfThisYear,
      beginningOfLastYear,
      endOfLastYear,
    }
  })
)

export const Reports = ({
  className,
  title,
  siteId,
  last7Days,
  last30Days,
  beginningOfThisYear,
  endOfThisYear,
  beginningOfLastYear,
  endOfLastYear,
  // --- injected by recompose ---
  showHigherLevel,
  token,
}) => {
  const HigherLevelReport = requirePermissions({
    permissions: ['dashboard:target'],
  })(() => (
    <Card className={className}>
      <div className={cssClasses('TitleContainer')}>
        <Title
          title={title}
          icon={
            <Icon
              className={cssClasses('Title__Icon')}
              type={require('../../../oldComponents/shared/icon/assets/reports.svg')}
            />
          }
        />
      </div>
      <div className={cssClasses('ReportsContainer')}>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/RifResistanceExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
        >
          Rif Report (last 7 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/MtbPositiveExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
        >
          MTB+ Report (last 7 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/IndeterminateExportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
        >
          TI Report (last 7 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/FailedTestsReportExcel.xlsx?dateFrom=${last7Days}&token=${token}`}
        >
          Failed Test Report (last 7 days)
        </Button>
      </div>
      <div className={cssClasses('ReportsContainer')}>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/RifResistanceExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
        >
          Rif Report (last 30 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/MtbPositiveExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
        >
          MTB+ Report (last 30 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/IndeterminateExportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
        >
          TI Report (last 30 days)
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/FailedTestsReportExcel.xlsx?dateFrom=${last30Days}&token=${token}`}
        >
          Failed Test Report (last 30 days)
        </Button>
      </div>
      <div className={cssClasses('ReportsContainer')}>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfLastYear}&dateTo=${endOfLastYear}&token=${token}`}
        >
          {`Quarterly Report ${new Date().getFullYear() - 1}`}
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfThisYear}&dateTo=${endOfThisYear}&token=${token}`}
        >
          {`Quarterly Report ${new Date().getFullYear()}`}
        </Button>
      </div>
    </Card>
  ))
  return (
    (showHigherLevel && <HigherLevelReport />) || (
      <Card className={className}>
        <div className={cssClasses('TitleContainer')}>
          <Title
            title={title}
            icon={
              <Icon
                className={cssClasses('Title__Icon')}
                type={require('../../../oldComponents/shared/icon/assets/reports.svg')}
              />
            }
          />
        </div>
        <div className={cssClasses('ReportsContainer')}>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/gx/LogsExportExcel.xlsx?dateFrom=${last30Days}&siteId=${siteId}&token=${token}`}
          >
            Inventory Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfLastYear}&dateTo=${endOfLastYear}&siteId=${siteId}&token=${token}`}
          >
            {`Quarterly Report ${new Date().getFullYear() - 1}`}
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/gx/QuarterlyReportExcel.xlsx?dateFrom=${beginningOfThisYear}&dateTo=${endOfThisYear}&siteId=${siteId}&token=${token}`}
          >
            {`Quarterly Report ${new Date().getFullYear()}`}
          </Button>
        </div>
      </Card>
    )
  )
}

export default enhance(Reports)
