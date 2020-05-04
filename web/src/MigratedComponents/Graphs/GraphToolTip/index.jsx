import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./GraphTooltip.css'))

const ToolTip = ({ values }) => {
  const { color, displayId, indexValue = false, displayValue } = values
  const positiveDisplayValue = Number.isInteger(displayValue)
    ? Math.abs(displayValue)
    : displayValue
  return (
    <div className={cssClasses('tooltip__container')}>
      <div className={cssClasses('tooltip__row')}>
        <div
          className={cssClasses('tooltip__color')}
          style={{ background: color }}
        />
        <div className={cssClasses('tooltip__text')}>
          &nbsp;{`${displayId}${indexValue ? ` - ${indexValue}` : ''}:`}
        </div>
        <div className={cssClasses('tooltip__value')}>
          &nbsp;{positiveDisplayValue}
        </div>
      </div>
    </div>
  )
}

export default ToolTip
