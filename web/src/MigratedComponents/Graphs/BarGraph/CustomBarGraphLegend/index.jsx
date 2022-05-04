import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import find from 'lodash/find'

import AspectTooltip from '../../../../components/shared/AspectTooltip'
import messages from '../../intlMessages'

import styles from './CustomLegend.css'

const cssClasses = classnames.bind(styles)

const LegendKey = ({
  symbolShape,
  color,
  label,
  tooltip: { show, placement, message },
  ...rest
}) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  return (
    <div
      {...rest}
      className={cssClasses(
        show
          ? ['legend__container', 'legend__container--popover']
          : 'legend__container'
      )}
    >
      <div
        className={cssClasses([
          'legend__color',
          `legend__color--${symbolShape}`,
        ])}
        style={{ background: color }}
      />
      <div className={cssClasses('legend__label')}>
        {show ? (
          <AspectTooltip
            title={
              <div className={cssClasses('legend__title')}>
                {intlFormatMessage(messages[message])}
              </div>
            }
            placement={placement}
            showHelpIcon
            toolTipClass="legend__container"
            toolTipContainerClass="legend__tooltip"
            iconClass="legendTooltip__icon"
          >
            {label}
          </AspectTooltip>
        ) : (
          label
        )}
      </div>
    </div>
  )
}

LegendKey.defaultProps = {
  tooltip: {
    show: false,
    placement: '',
    message: '',
  },
}

LegendKey.propTypes = {
  symbolShape: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.shape({
    show: PropTypes.bool.isRequired,
    placement: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  }),
}

const CustomBarGraphLegend = ({
  keys,
  generateLegendIntl,
  assaysFromState,
  type,
  graphId,
  legendsNotToRender,
  legendsToPopover,
  symbolShape,
  i18nKeys,
}) => {
  const { formatMessage } = useIntl()
  return (
    <div
      className={cssClasses([
        'customLegend__container',
        `customLegend__container--${type}`,
      ])}
    >
      {keys.map(k => {
        const { tooltip } =
          find(legendsToPopover, { externalId: k, tooltip: { show: true } }) ||
          false
        const { label = '?', color = '#999999' } = generateLegendIntl(
          formatMessage,
          messages,
          i18nKeys,
          k,
          assaysFromState,
          graphId,
          legendsNotToRender
        )

        return (
          <LegendKey
            symbolShape={symbolShape}
            color={color}
            label={label}
            tooltip={tooltip}
            key={k}
          />
        )
      })}
    </div>
  )
}

CustomBarGraphLegend.defaultProps = {
  assaysFromState: [],
  symbolShape: 'circle',
}

CustomBarGraphLegend.propTypes = {
  keys: PropTypes.arrayOf(PropTypes.string).isRequired,
  generateLegendIntl: PropTypes.func.isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  type: PropTypes.string.isRequired,
  graphId: PropTypes.string.isRequired,
  symbolShape: PropTypes.string,
  legendsNotToRender: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  ).isRequired,
  legendsToPopover: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
  ).isRequired,
  i18nKeys: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
}

export default CustomBarGraphLegend
