import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import flattenDeep from 'lodash/flattenDeep'
import groupBy from 'lodash/groupBy'
import get from 'lodash/get'
import _ from 'lodash'
import { PieInnerLegend } from '../GraphLegend'

import {
  generateColorForValue,
  generateToolTip,
  percentageOrActualForPie,
} from '../Helpers/Formatters'

import { GraphToolTip } from '../GraphToolTip'

import AspectResponsivePie from '../PieGraph/AspectResponsivePie'
import messages from './messages'

const cssClasses = classnames.bind(require('./PieRowGraph.css'))

const AspectResponsiveRow = ({ data, componentClasses }) => {
  const {
    formatNumber: intlFormatNumber,
    formatMessage: intlFormatMessage,
  } = useIntl()

  const headings = graphData => _.map(graphData[0], 'heading')

  return (
    <div className={cssClasses('piegraph__container')}>
      {data && data.length ? (
        <Fragment>
          <div
            className={cssClasses(['piegraphs__row', 'piegraphs__row--header'])}
          >
            {headings(data).map(heading => (
              <div className={cssClasses('piegraphs__column')}>
                <div className={cssClasses('piegraphs__columnTitle')}>
                  {intlFormatMessage(messages[heading])}
                </div>
              </div>
            ))}
          </div>
          {data.map(row => (
            <div className={cssClasses('piegraphs__row')}>
              {row.map(pie => {
                const { value, type } = pie
                return (
                  <div className={cssClasses('piegraphs__column')}>
                    <div className={cssClasses('piegraphs__columnGraph')}>
                      {type === 'string' ? (
                        <div className={cssClasses('piegraphs__rowTitle')}>
                          {value[0].value}
                        </div>
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
