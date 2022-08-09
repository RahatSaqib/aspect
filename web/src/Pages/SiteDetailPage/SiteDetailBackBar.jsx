import { defineMessages } from 'react-intl'
import React from 'react'
import AspectButton from '../../components/shared/AspectButton'
import DetailBackBar from '../../globals/components/DetailBackBar'

const messages = defineMessages({
  profile: {
    id: 'pages.SiteDetail.profile',
    defaultMessage: 'Profile',
  },
  alerts: {
    id: 'pages.SiteDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.SiteDetail.edit',
    defaultMessage: 'Edit',
  },
})

export const SiteDetailBackBar = ({ formatMessage, navigate, location, params, title, disabled }) => {
  const onBackClick = () => {
    navigate(-1)
  }
  const onPathClick = path => {
    navigate({
      pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => params[key]),
    })
  }
  return (
    <DetailBackBar onBackClick={onBackClick} title={title}>
      {[
        {
          label: formatMessage(messages.profile),
          path: `/browse/site/:siteId`,
        },
        {
          label: formatMessage(messages.alerts),
          path: `/browse/site/:siteId/alerts`,
        },
        {
          label: formatMessage(messages.edit),
          path: `/browse/site/:siteId/edit`,
          disabled,
        },
      ].map(({ label, path, disabled = false }) => (
        <AspectButton
          key={path}
          onClick={({
            currentTarget: {
              dataset: { path },
            },
          }) => onPathClick(path)}
          disabled={disabled}
          data-path={path}
          color="primary"
          variant="contained"
          inverse={location.pathname !== path && !disabled}
        >
          {label}
        </AspectButton>
      ))}
    </DetailBackBar>
  )
}

export default SiteDetailBackBar
