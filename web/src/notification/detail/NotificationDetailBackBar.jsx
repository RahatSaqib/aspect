import { defineMessages, injectIntl } from 'react-intl'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import PropTypes from 'prop-types'

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
  injectIntl,
  withHandlers({
    onBackClick:
      ({ history }) =>
      () => {
        history.goBack()
      },
    onPathClick:
      ({ history, match }) =>
      path => {
        history.push({
          pathname: path.replace(
            /:([A-Za-z]+)/g,
            ($, key) => match.params[key]
          ),
        })
      },
  })
)

export const NotificationDetailBackBar = ({
  intl,
  history,
  location,
  match,
  title,
  // --- injected by recompose ---
  onBackClick,
  onPathClick,
  disabled = true,
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
        hidden: true,
      },
      {
        label: intl.formatMessage(messages.edit),
        path: `/browse/notification/:notificationId/edit`,
        disabled,
        hidden: true,
      },
      {
        label: intl.formatMessage(messages.history),
        path: `/browse/notification/:notificationId/history`,
        hidden: false,
      },
    ].map(
      ({ label, path, disabled, hidden }) =>
        !hidden && (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => onPathClick(path)}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={match.path !== path}
            disabled={disabled}
          >
            {label}
          </AspectButton>
        )
    )}
  </DetailBackBar>
)

NotificationDetailBackBar.propTypes = {
  intl: PropTypes.oneOfType([PropTypes.object]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  history: PropTypes.oneOfType([PropTypes.object]).isRequired,
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onBackClick: PropTypes.func.isRequired,
  onPathClick: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
}

export default enhance(NotificationDetailBackBar)
