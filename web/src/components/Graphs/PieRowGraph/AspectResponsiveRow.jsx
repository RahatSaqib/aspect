import React, { Fragment } from 'react'
import classnames from 'classnames/bind'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import useI18n from '../../../hooks/useI18n'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'
import AspectResponsivePie from '../PieGraph/AspectResponsivePie'
import messages from './messages'
import styles from './PieRowGraph.css'

const cssClasses = classnames.bind(styles)

const AspectResponsiveRow = ({ data, componentClasses, config }) => {
  const { formatMessage: intlFormatMessage } = useI18n()

  const headings = graphData => map(graphData[0], 'heading')
  const getRowKey = rowIndex => `row-${rowIndex}`

  return (
    <div className={cssClasses('piegraph__container')}>
      {data && data.length ? (
        <Fragment>
          <div className={cssClasses(['piegraphs__row', 'piegraphs__row--header'])}>
            {headings(data).map(heading => (
              <div key={heading} className={cssClasses('piegraphs__column')}>
                <div className={cssClasses('piegraphs__columnTitle')}>
                  {messages[`${heading}Description`] ? (
                    <AspectTooltip showHelpIcon title={intlFormatMessage(messages[`${heading}Description`])}>
                      {intlFormatMessage(messages[heading])}
                    </AspectTooltip>
                  ) : (
                    intlFormatMessage(messages[heading])
                  )}
                </div>
              </div>
            ))}
          </div>
          {data.map((row, rowIndex) => (
            <div key={getRowKey(rowIndex)} className={cssClasses('piegraphs__row')}>
              {row.map(pie => {
                const { value, type, link, heading } = pie
                const skipConfig = type === 'solid' || (type === 'doughnut' && value[0].value === 0)
                return (
                  <div key={`${heading}-${type}`} className={cssClasses('piegraphs__column')}>
                    <div className={cssClasses('piegraphs__columnGraph')}>
                      {type === 'string' ? (
                        <div className={cssClasses('piegraphs__rowTitle')}>{value[0].value}</div>
                      ) : null}
                      {type === 'doughnut' || type === 'solid' ? (
                        <AspectResponsivePie
                          assaysFromState={[]}
                          averages={false}
                          data={value}
                          displayMethod="percentage"
                          componentClasses={componentClasses}
                          keys={[]}
                          type={type}
                          link={link}
                          config={skipConfig ? {} : config}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </Fragment>
      ) : null}
    </div>
  )
}
AspectResponsiveRow.defaultProps = {
  config: {},
}

AspectResponsiveRow.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  componentClasses: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.object,
}

export default AspectResponsiveRow
