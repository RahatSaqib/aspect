import React from 'react'
import { PropTypes } from 'prop-types'
import { useIntl } from 'react-intl'
import IconProvider from '../../IconProvider'
import AspectTooltip from '../../shared/AspectTooltip'
import styles from './alerts.module.css'
import format from './messages'

const WidgetAlert = ({ alert }) => {
  const { formatMessage } = useIntl()
  const explanation = format(formatMessage, alert)
  return (
    <AspectTooltip title={explanation} className={styles.summary_widgetAlertTooltip}>
      <IconProvider icon="FaExclamationCircle" className={styles.summary_widgetAlertIcon} />
    </AspectTooltip>
  )
}

WidgetAlert.propTypes = {
  alert: PropTypes.shape({
    whenIs: PropTypes.string.isRequired,
    representing: PropTypes.string.isRequired,
    comparedTo: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  }).isRequired,
}

export default WidgetAlert
