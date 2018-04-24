import classnames from 'classnames/bind'
import _ from 'lodash'
import React from 'react'
import { compose, pure, withProps, withStateHandlers } from 'recompose'
import { Card } from 'react-toolbox/lib/card'
import { Button } from 'react-toolbox/lib/button'
import { Dialog } from 'react-toolbox/lib/dialog'

import Title from './Title'
import Icon from '../../components/shared/icon/Icon'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  pure,
  requirePermissions({
    features: ['reportDashboard'],
  }),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    return {
      isShow: _.isEmpty(filtersParams.get('siteId')),
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
  intl,
  className,
  title,
  // --- injected by recompose ---
  isShow,
  isDemoDialogOpen,
  handleToggleDialog,
}) =>
  isShow && (
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
          {intl.formatMessage(messages.downloadReport)}
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          onClick={handleToggleDialog}
        >
          {intl.formatMessage(messages.downloadReport)}
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          onClick={handleToggleDialog}
        >
          {intl.formatMessage(messages.downloadReport)}
        </Button>
        <Button
          className={cssClasses('ReportsContainer__Button')}
          inverse
          onClick={handleToggleDialog}
        >
          {intl.formatMessage(messages.downloadReport)}
        </Button>
      </div>
      <Dialog
        active={isDemoDialogOpen}
        onEscKeyDown={handleToggleDialog}
        onOverlayClick={handleToggleDialog}
      >
        Not implemented yet
      </Dialog>
    </Card>
  )

export default enhance(Reports)
