import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import DetailBackBar from '../../globals/components/DetailBackBar'

const messages = defineMessages({
  view: {
    id: 'pages.NotificationDetail.view',
    defaultMessage: 'View',
  },
  edit: {
    id: 'pages.NotificationDetail.edit',
    defaultMessage: 'Edit',
  },
  history: {
    id: 'pages.NotificationDetail.history',
    defaultMessage: 'History',
  },
})

const enhance = compose(
  withHandlers({
    onBackClick: ({ history }) => () => {
      history.goBack()
    },
    onPathClick: ({ history, match }) => ({
      target: { dataset: { path } },
    }) => {
      history.push({
        pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => match.params[key]),
      })
    },
  })
)

const NotificationDetailBackBar = ({
  intl,
  history,
  location,
  match,
  title,
  // --- injected by recompose ---
  onBackClick,
  onPathClick,
}) => (
  <DetailBackBar
    history={history}
    location={location}
    match={match}
    onBackClick={onBackClick}
    title={title}
  >
    {[
      {
        label: intl.formatMessage(messages.view),
        path: `/browse/notification/:notificationId`,
      },
      {
        label: intl.formatMessage(messages.edit),
        path: `/browse/notification/:notificationId/edit`,
        disabled: true,
      },
      {
        label: intl.formatMessage(messages.history),
        path: `/browse/notification/:notificationId/history`,
        disabled: true,
      },
    ].map(({ label, path, disabled }) => (
      <Button
        key={path}
        onClick={onPathClick}
        data-path={path}
        primary
        raised
        inverse={match.path !== path}
        disabled={disabled}
      >
        {label}
      </Button>
    ))}
  </DetailBackBar>
)

export default enhance(NotificationDetailBackBar)
