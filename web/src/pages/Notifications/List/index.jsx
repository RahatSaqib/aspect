import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { defineMessages } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import AspectDropDown from '../../../components/AspectDropDown'
import AspectTable from '../../../components/AspectTable'
import { useUrlQuery } from '../../../components/AspectTable/Helpers'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import Shell from '../../../components/Shell'
import ShellContent from '../../../components/Shell/Content'
import useI18n from '../../../hooks/useI18n'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import { reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import { useAuthState } from '../../../providers/AuthProvider'
import UI_CONSTS from '../../../utils/consts/UI'
import styles from '../Notifications.css'
import { baseConfig, getCreateNotificationMenuProps } from './config'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications',
  },
  createLabel: {
    id: 'pages.PersonDetails.create',
    defaultMessage: 'Create',
  },
})

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { notificationName: true, requiredPermissions: [] },
]

const NotificationList = () => {
  const intl = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const query = useUrlQuery(location.search)
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const notificationMenuProps = getCreateNotificationMenuProps(intl)
  const createLabel = intl.formatMessage(messages.createLabel)
  return (
    <Fragment>
      <Helmet title={intl.formatMessage(messages.notificationsTitle)} />
      <NavTitle title={intl.formatMessage(messages.notificationsTitle)} />
      <div className={cssClasses('filters__container')}>
        <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters}>
          <AspectDropDown
            props={{
              components: notificationMenuProps.components,
              identifier: 'createNotification',
              data: {
                createNotification: notificationMenuProps.options,
              },
              state: 'createNotification',
              isClearable: false,
              placeholder: createLabel,
              selectedValue: '',
            }}
            action={({ selectedOption }) => {
              const { id } = selectedOption
              /**
               * redirect to Notification Edit page with param `returnUrl` in
               * query string - to preserve current filters, page size, sorting, etc
               */
              const q = new URLSearchParams({
                returnUrl: `${location.pathname}?${query.toString()}`,
              })
              navigate(`/browse/notification/${id}?${q.toString()}`)
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
        style={{ marginTop: '-10px' }}
      >
        <Shell>
          <ShellContent>
            <AspectTable baseConfig={baseConfig} consts={NOTIFICATION_LIST} FILTERS_CONFIG={FILTERS_CONFIG} />
          </ShellContent>
        </Shell>
      </div>
    </Fragment>
  )
}

export default NotificationList
