import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import startCase from 'lodash/startCase'

const cssClasses = classnames.bind(require('./GraphTooltip.css'))

const GraphToolTip = ({ displayMethod, values }) => {
  const { color, displayId, indexValue = false, displayValue } = values

  return (
    <div className={cssClasses('tooltip__container')}>
      <div className={cssClasses('tooltip__row')}>
        <div
          className={cssClasses('tooltip__color')}
          style={{ background: color }}
        />
        <div className={cssClasses('tooltip__text')}>
          {`${displayId}${indexValue ? ` - ${indexValue}` : ''}: `}
        </div>

        <div className={cssClasses('tooltip__value')}>
          {typeof displayValue === 'object' ? (
            <div className={cssClasses('tooltip__valueContainer')}>
              {displayMethod === 'percentage' ? (
                <div className={cssClasses('tooltip__valueSecondary')}>
                  ({displayValue.actual.percentageToValue}/
                  {displayValue.actual.totalCnt} results)
                </div>
              ) : (
                <div className={cssClasses('tooltip__valuePrimary')}>
                  {displayValue.value}/{displayValue.actual.totalCnt}
                </div>
              )}
            </div>
          ) : (
            <div className={cssClasses('tooltip__valuePrimary')}>
              {displayValue}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

GraphToolTip.propTypes = {
  displayMethod: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

const EmptyTooltip = ({ title }) => (
  <div className={cssClasses('tooltip__container')}>
    <div className={cssClasses('tooltip__text')}>{startCase(title)}</div>
  </div>
)

export { GraphToolTip, EmptyTooltip }
