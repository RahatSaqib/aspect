import React from 'react'
import { useIntl } from 'react-intl'
import { PropTypes } from 'prop-types'

import classnames from 'classnames/bind'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import IconProvider from '../../IconProvider'
import format from './messages'

import styles from './alerts.css'

const cssClasses = classnames.bind(styles)

const WidgetAlert = ({ alert }) => {
  const { formatMessage } = useIntl()
  const explanation = format(formatMessage, alert)
  return (
    <AspectTooltip title={explanation} className={cssClasses('summary_widgetAlertTooltip')}>
      <IconProvider icon="FaExclamationCircle" className={cssClasses('summary_widgetAlertIcon')} />
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
