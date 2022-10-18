import React from 'react'
import classnames from 'classnames/bind'
import startCase from 'lodash/startCase'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import useI18n from '../../../hooks/useI18n'
import styles from './GraphTooltip.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  toolTipTitleWithPercentageSplit: {
    id: 'pages.DailyStatus.DailyStatusClinicDay.toolTipTitleWithPercentageSplit',
    defaultMessage: `{value} ({records}/{total, plural,
      one {# result}
      other {# results}
    })`,
  },
  toolTipAllowClickThrough: {
    id: 'pages.Graphs.toolTipAllowClickThrough',
    defaultMessage: 'Click to view results in table format',
  },
})

const GraphToolTip = ({ clickThrough, displayMethod, values }) => {
  const { formatMessage } = useI18n()
  const { color, displayId, indexValue = false, displayValue } = values
  return (
    <div className={cssClasses('tooltip__container')}>
      <div className={cssClasses('tooltip__row')}>
        <div className={cssClasses('tooltip__color')} style={{ background: color }} />
        <div className={cssClasses('tooltip__text')}>{`${displayId}${indexValue ? ` - ${indexValue}` : ''}: `}</div>

        <div className={cssClasses('tooltip__value')}>
          {typeof displayValue === 'object' ? (
            <div className={cssClasses('tooltip__valueContainer')}>
              {displayMethod === 'percentage' ? (
                <div className={cssClasses('tooltip__valueSecondary')}>
                  {formatMessage(messages.toolTipTitleWithPercentageSplit, {
                    value: displayValue.value,
                    records: displayValue.actual.percentageToValue,
                    total: displayValue.actual.totalCnt,
                  })}
                </div>
              ) : (
                <div className={cssClasses('tooltip__valuePrimary')}>
                  {displayValue.value}/{displayValue.actual.totalCnt}
                </div>
              )}
            </div>
          ) : (
            <div className={cssClasses('tooltip__valuePrimary')}>{displayValue}</div>
          )}
        </div>
      </div>
      {clickThrough ? (
        <div className={cssClasses('tooltip__row')}>
          <div className={cssClasses('tooltip__allowsClickthrough')}>
            {formatMessage(messages.toolTipAllowClickThrough)}
          </div>
        </div>
      ) : null}
    </div>
  )
}

GraphToolTip.propTypes = {
  displayMethod: PropTypes.string.isRequired,
  values: PropTypes.oneOfType([PropTypes.object]).isRequired,
  clickThrough: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      allow: PropTypes.bool,
      baseUrl: PropTypes.string,
      keys: PropTypes.oneOfType([PropTypes.array]),
    }),
  ]).isRequired,
}

const EmptyTooltip = ({ title }) => (
  <div className={cssClasses('tooltip__container')}>
    <div className={cssClasses('tooltip__text')}>{startCase(title)}</div>
  </div>
)

export { GraphToolTip, EmptyTooltip }
