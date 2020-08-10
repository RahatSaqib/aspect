import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import startCase from 'lodash/startCase'
import isArray from 'lodash/isArray'

const cssClasses = classnames.bind(require('./GraphTooltip.css'))

const GraphToolTip = ({ className, values }) => {
  const rows = isArray(values) ? values : [values]
  return (
    <div
      className={classnames(cssClasses('tooltip__container'), {
        [className]: !!className,
      })}
    >
      {rows.map(({ color, displayId, indexValue = false, displayValue }) => (
        <div className={cssClasses('tooltip__row')}>
          <div
            className={cssClasses('tooltip__color')}
            style={{ background: color }}
          />
          <div className={cssClasses('tooltip__text')}>
            {`${displayId}${indexValue ? ` - ${indexValue}` : ''}: `}
          </div>
          <div className={cssClasses('tooltip__value')}>{displayValue}</div>
        </div>
      ))}
    </div>
  )
}

GraphToolTip.propTypes = {
  className: PropTypes.string,
  values: PropTypes.oneOfType([PropTypes.object]).isRequired,
}
GraphToolTip.defaultProps = {
  className: null,
}

const EmptyTooltip = ({ title }) => (
  <div className={cssClasses('tooltip__container')}>
    <div className={cssClasses('tooltip__text')}>{startCase(title)}</div>
  </div>
)

export { GraphToolTip, EmptyTooltip }
