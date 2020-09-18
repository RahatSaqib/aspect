import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import find from 'lodash/find'
import Tooltip from '@material-ui/core/Tooltip'
import messages from './messages'

const cssClasses = classnames.bind(require('./CustomLegend.css'))

const LegendKey = props => {
  const { symbolShape, color, label, tooltip } = props
  return (
    <div
      {...props}
      className={cssClasses(
        tooltip
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
      <div className={cssClasses('legend__label')}>{label}</div>
    </div>
  )
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
  const { formatMessage: intlFormatMessage } = useIntl()
  return (
    <div
      className={cssClasses([
        'customLegend__container',
        `customLegend__container--${type}`,
      ])}
    >
      {keys.map(k => {
        const { tooltip: { show, placement, message } = false } =
          find(legendsToPopover, { externalId: k, tooltip: { show: true } }) ||
          false

        const { label, color } = generateLegend(
          k,
          assaysFromState,
          type,
          legendsNotToRender,
          legendsToRename
        )

        return show ? (
          <Tooltip
            title={<div>{intlFormatMessage(messages[message])}</div>}
            placement={placement}
          >
            <LegendKey
              symbolShape={symbolShape}
              color={color}
              label={label}
              tooltip={show}
            />
          </Tooltip>
        ) : (
          <LegendKey symbolShape={symbolShape} color={color} label={label} />
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
