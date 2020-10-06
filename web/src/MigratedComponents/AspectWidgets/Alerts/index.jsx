import React from 'react'
import { useIntl } from 'react-intl'
import { PropTypes } from 'prop-types'

import classnames from 'classnames/bind'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import IconProvider from '../../IconProvider'
import format from './messages'

const cssClasses = classnames.bind(require('./alerts.css'))

const WidgetAlert = ({ alert }) => {
  const { formatMessage } = useIntl()
  const explanaition = format(formatMessage, alert)
  return (
    <AspectTooltip
      title={explanaition}
      className={cssClasses('summary_widgetAlertTooltip')}
    >
      <IconProvider
        icon="FaExclamationCircle"
        className={cssClasses('summary_widgetAlertIcon')}
      />
    </AspectTooltip>
  )
}

WidgetAlert.propTypes = {
  alert: PropTypes.shape({
    whenIs: PropTypes.string.isRequired,
    representing: PropTypes.string.isRequired,
    comparedTo: PropTypes.isRequired,
  }).isRequired,
}

export default WidgetAlert
