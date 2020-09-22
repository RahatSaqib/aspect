import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import find from 'lodash/find'

import AspectTooltip from '../../../../components/shared/AspectTooltip'
import messages from './messages'

const cssClasses = classnames.bind(require('./CustomLegend.css'))

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
  tooltip: false,
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
  generateLegend,
  assaysFromState,
  type,
  legendsNotToRender,
  legendsToRename,
  legendsToPopover,
  symbolShape,
}) => {
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

        const { label, color } = generateLegend(
          k,
          assaysFromState,
          type,
          legendsNotToRender,
          legendsToRename
        )

        return (
          <LegendKey
            symbolShape={symbolShape}
            color={color}
            label={label}
            tooltip={tooltip}
          />
        )
      })}
    </div>
  )
}

CustomBarGraphLegend.defaultProps = {
  assaysFromState: {},
  symbolShape: 'circle',
}

CustomBarGraphLegend.propTypes = {
  keys: PropTypes.oneOf([PropTypes.object]).isRequired,
  generateLegend: PropTypes.func.isRequired,
  assaysFromState: PropTypes.oneOf([PropTypes.object]),
  type: PropTypes.string.isRequired,
  symbolShape: PropTypes.string,
  legendsNotToRender: PropTypes.oneOf([PropTypes.object]).isRequired,
  legendsToRename: PropTypes.oneOf([PropTypes.array]).isRequired,
  legendsToPopover: PropTypes.oneOf([PropTypes.array]).isRequired,
}

export default CustomBarGraphLegend
