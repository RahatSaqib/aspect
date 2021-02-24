import React, { Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { defineMessages, useIntl } from 'react-intl'
import { useHistory } from 'react-router-dom'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'

import NavTitle from '../../../../globals/components/NavTitle'

import Shell from '../../../Shell'
import ShellContent from '../../../Shell/Content'
import AspectTable from '../../../AspectTable'
import { NOTIFICATION_HISTORY } from '../../../QueryFetch/Notification'
import baseConfig from './config'

const cssClasses = classnames.bind(require('../../Notifications.css'))

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.notificationsTitle',
    defaultMessage: 'Notifications History',
  },
  backButton: {
    id: 'pages.NotificationList.backButton',
    defaultMessage: 'Back',
  },
})

const NotificationList = () => {
  const intl = useIntl()
  const { push } = useHistory()
  return (
    <Fragment>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
      <div className={cssClasses('back-button__container')}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => push('/browse/notification')}
        >
          {intl.formatMessage(messages.backButton)}
        </Button>
      </div>
      <div
        /**
         * TODO:temp fix before all tables are placed with
         * the <Shell component />
         */
        style={{ marginTop: '-22px' }}
      >
        <Shell>
          <ShellContent>
            <AspectTable
              baseConfig={baseConfig}
              consts={NOTIFICATION_HISTORY}
            />
          </ShellContent>
        </Shell>
      </div>
    </Fragment>
  )
}

export default NotificationList
