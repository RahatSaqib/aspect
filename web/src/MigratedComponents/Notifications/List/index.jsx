import React, { Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { defineMessages, useIntl } from 'react-intl'
import { useHistory, useLocation } from 'react-router-dom'
import classnames from 'classnames/bind'

import AspectDropDown from '../../AspectDropDown'
import UI_CONSTS from '../../../globals/consts/UI'
import NavTitle from '../../../globals/components/NavTitle'
import BrowseFilters from '../../../globals/components/BrowseFilters'
import { reduceFiltersConfig } from '../../../filter/utils'
import { useAuthState } from '../../../Providers/AuthProvider'

import Shell from '../../Shell'
import ShellContent from '../../Shell/Content'
import AspectTable from '../../AspectTable'
import { NOTIFICATION_LIST } from '../../QueryFetch/Notification'
import { baseConfig, notificationMenuProps } from './config'

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
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const filtersConfig = [{ notificationName: true, requiredPermissions: [] }]
  const reducedFilters = reduceFiltersConfig(filtersConfig, userPermissions)
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
        >
          <AspectDropDown
            props={{
              components: notificationMenuProps.components,
              identifier: 'createNotification',
              data: {
                createNotification: notificationMenuProps.options,
              },
              state: 'createNotification',
              isClearable: false,
              placeholder: 'Create...',
            }}
            action={({ selectedOption }) => {
              const { id } = selectedOption
              history.push(`/browse/notification/${id}`)
            }}
            theme={UI_CONSTS.themeName.aspect}
          />
        </BrowseFilters>
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
