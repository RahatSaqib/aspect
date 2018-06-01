import classnames from 'classnames/bind'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { compose, pure, withProps, withStateHandlers } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import { Dialog } from 'react-toolbox/lib/dialog'
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
    return {
      showHigherLevel: _.isEmpty(filtersParams.get('siteId')),
      token: getAspectAccess(),
    }
  }),
  withStateHandlers(
    () => ({
      isDemoDialogOpen: false,
    }),
    {
      handleToggleDialog: ({ isDemoDialogOpen }) => () => ({
        isDemoDialogOpen: !isDemoDialogOpen,
      }),
    }
  )
)

export const Reports = ({
  className,
  title,
  // --- injected by recompose ---
  showHigherLevel,
  userFeatures,
  isDemoDialogOpen,
  handleToggleDialog,
  token,
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
            href={`${
              config.aspectApi
            }/report/gx/RifResistanceRateExportExcel.xlsx?stateName=Ayeyarwady&dateFrom=null&dateTo=null&token=${token}`}
          >
            Rif Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            onClick={handleToggleDialog}
          >
            MTB+ Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            onClick={handleToggleDialog}
          >
            TI Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            onClick={handleToggleDialog}
          >
            Quarterly Report
          </Button>
          <Button
            className={cssClasses('ReportsContainer__Button')}
            inverse
            onClick={handleToggleDialog}
          >
            Failed Test Report
          </Button>
        </div>
        <Dialog
          active={isDemoDialogOpen}
          onEscKeyDown={handleToggleDialog}
          onOverlayClick={handleToggleDialog}
        >
          Regional Officer reports not implemented yet
        </Dialog>
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
          onClick={handleToggleDialog}
        >
          Inventory Report
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          onClick={handleToggleDialog}
        >
          Quarterly Report
        </Button>
      </div>
      <Dialog
        active={isDemoDialogOpen}
        onEscKeyDown={handleToggleDialog}
        onOverlayClick={handleToggleDialog}
      >
        Lab User reports not implemented yet
      </Dialog>
    </Card>
  )

export default enhance(Reports)
