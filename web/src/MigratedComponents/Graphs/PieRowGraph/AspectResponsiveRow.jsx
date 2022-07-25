import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import map from 'lodash/map'
import AspectTooltip from '../../../components/shared/AspectTooltip'

import AspectResponsivePie from '../PieGraph/AspectResponsivePie'
import messages from './messages'

import styles from './PieRowGraph.css'

const cssClasses = classnames.bind(styles)

const AspectResponsiveRow = ({ data, componentClasses }) => {
  const { formatMessage: intlFormatMessage } = useIntl()

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

AspectResponsiveRow.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  componentClasses: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default AspectResponsiveRow
