import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./CustomLegend.css'))

const CustomBarGraphLegend = ({
  keys,
  generateLegend,
  assaysFromState,
  type,
  legendsNotToRender,
}) => {
  return type === 'stackedDeviceActivity' ? (
    <div className={cssClasses('customLegend__container')}>
      {keys.map(k => {
        const { label, color } = generateLegend(
          k,
          assaysFromState,
          type,
          legendsNotToRender
        )
        return (
          <div className={cssClasses('legend__container')}>
            <div
              className={cssClasses('legend__color')}
              style={{ background: color }}
            />
            <div className={cssClasses('legend__label')}>{label}</div>
          </div>
        )
      })}
    </div>
  ) : null
}

CustomBarGraphLegend.defaultProps = {
  assaysFromState: {},
}
CustomBarGraphLegend.propTypes = {
  keys: PropTypes.oneOf([PropTypes.object]).isRequired,
  generateLegend: PropTypes.func.isRequired,
  assaysFromState: PropTypes.oneOf([PropTypes.object]),
  type: PropTypes.string.isRequired,
  legendsNotToRender: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default CustomBarGraphLegend
