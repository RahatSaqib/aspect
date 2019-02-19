import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import AspectButton from '../../components/shared/AspectButton'
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
    onPathClick: ({ history, match }) => path => {
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
      },
    ].map(({ label, path, disabled }) => (
      <AspectButton
        key={path}
        onClick={({ currentTarget: { dataset: { path } } }) =>
          onPathClick(path)
        }
        data-path={path}
        color="primary"
        variant="contained"
        inverse={match.path !== path}
        disabled={disabled}
      >
        {label}
      </AspectButton>
    ))}
  </DetailBackBar>
)

export default enhance(NotificationDetailBackBar)
