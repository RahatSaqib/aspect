import React from 'react'
import { PropTypes } from 'prop-types'

import classnames from 'classnames/bind'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'
import IconProvider from '../../IconProvider'
import format from './messages'

import styles from './alerts.css'
import useI18n from '../../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const WidgetAlert = ({ alert }) => {
  const { formatMessage } = useI18n()
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
