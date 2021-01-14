import React, { Fragment } from 'react'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import { defineMessages, useIntl } from 'react-intl'
import { useHistory, useLocation } from 'react-router-dom'
import classnames from 'classnames/bind'

import NavTitle from '../../../globals/components/NavTitle'
import BrowseFilters from '../../../globals/components/BrowseFilters'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../../filter/utils'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import { AspectTable } from '../../AspectTable'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'
import baseConfig from './config'

const cssClasses = classnames.bind(require('../Notifications.css'))

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications',
  },
})

const NotificationList = () => {
  const intl = useIntl()
  const history = useHistory()
  const location = useLocation()
  const userPermissions = useSelector(state => state.user.jwt.permissions)
  const FILTERS_CONFIG = [{ notificationName: true, requiredPermissions: [] }]
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  return (
    <Fragment>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
      <div className={cssClasses('filters__container')}>
        <BrowseFilters
          history={history}
          location={location}
          intl={intl}
          config={reducedFilters}
        />
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
            <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_LIST} />
          </ShellContent>
        </Shell>
      </div>
    </Fragment>
  )
}

export default NotificationList
