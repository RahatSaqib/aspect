import classnames from 'classnames/bind'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { compose, pure, withProps } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import config from '../../config'

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
    return {
      showHigherLevel: _.isEmpty(filtersParams.get('siteId')),
    }
  })
)

export const Reports = ({
  className,
  title,
  // --- injected by recompose ---
  showHigherLevel,
  userFeatures,
}) =>
  (showHigherLevel &&
    isEnabledFeature(userFeatures, ['siteFilterDashboard']) && (
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
            href={`${config.aspectApi}/report/RifReport.xlsx`}
          >
            Rif Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/MtbPlusReport.xlsx`}
          >
            MTB+ Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/TiReport.xlsx`}
          >
            TI Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/QuarterlyReport.xlsx`}
          >
            Quarterly Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            href={`${config.aspectApi}/report/FailedTestReport.xlsx`}
          >
            Failed Test Report
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
          href={`${config.aspectApi}/report/InventoryReport.xlsx`}
        >
          Inventory Report
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          href={`${config.aspectApi}/report/QuarterlyReport.xlsx`}
        >
          Quarterly Report
        </Button>
      </div>
    </Card>
  )

export default enhance(Reports)
