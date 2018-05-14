import { defineMessages } from 'react-intl'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import DetailBackBar from '../../globals/components/DetailBackBar'

const messages = defineMessages({
  profile: {
    id: 'pages.DeviceDetail.profile',
    defaultMessage: 'Profile',
  },
  operation: {
    id: 'pages.DeviceDetail.operation',
    defaultMessage: 'Operation',
  },
  alerts: {
    id: 'pages.DeviceDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.DeviceDetail.edit',
    defaultMessage: 'Edit',
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

const DeviceDetailBackBar = ({
  intl,
  history,
  location,
  match,
  title,
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
        label: intl.formatMessage(messages.profile),
        path: `/browse/device/:deviceId`,
      },
      {
        label: intl.formatMessage(messages.operation),
        path: `/browse/device/:deviceId/operation`,
      },
      {
        label: intl.formatMessage(messages.alerts),
        path: `/browse/device/:deviceId/alerts`,
      },
      {
        label: intl.formatMessage(messages.edit),
        path: `/browse/device/:deviceId/edit`,
      },
    ].map(({ label, path }) => (
      <Button
        key={path}
        onClick={onPathClick}
        data-path={path}
        primary
        raised
        inverse={match.path !== path}
      >
        {label}
      </Button>
    ))}
  </DetailBackBar>
)

export default enhance(DeviceDetailBackBar)
