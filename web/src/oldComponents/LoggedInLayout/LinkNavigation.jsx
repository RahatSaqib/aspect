import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import ThemedLink from './ThemedLink'
import messages from './messages'

import styles from './index.css'
import useI18n from '../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

export const LinkNavigation = ({ type, onClick, children }) => {
  const { formatMessage } = useI18n()
  const rawLinks = [
    {
      href: '/dashboard',
      label: formatMessage(messages.homeTitle),
      requiredPermissions: ['dashboard:summary'],
    },
    {
      href: '/task-list',
      label: formatMessage(messages.taskListTitle),
      requiredPermissions: ['taskMenu'],
    },
    {
      href: '/operational-data',
      label: formatMessage(messages.operationDataTitle),
      requiredPermissions: ['operationalData'],
    },
    {
      href: '/clinical-indicators',
      label: formatMessage(messages.clinicalIndicatorsTitle),
      requiredPermissions: ['clinicalIndicators'],
    },
    {
      href: '/browse',
      label: formatMessage(messages.browseTitle),
      requiredPermissions: ['browse'],
    },
    {
      href: '/reports',
      label: formatMessage(messages.reportsTitle),
      requiredPermissions: ['report'],
    },
    {
      href: '/manage',
      label: formatMessage(messages.manageTitle),
      requiredPermissions: ['manage'],
    },
  ]
  return (
    <nav
      type={type}
      className={cssClasses('Navigation', {
        'Navigation--vertical': type === 'vertical',
        'Navigation--horizontal': type === 'horizontal',
      })}
    >
      {rawLinks.map(link => (
        <ThemedLink key={link.label} {...link} onClick={onClick} />
      ))}
      {children}
    </nav>
  )
}

LinkNavigation.defaultProps = {
  children: null,
}

LinkNavigation.propTypes = {
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([PropTypes.object]),
}

export default LinkNavigation
