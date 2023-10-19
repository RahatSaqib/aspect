import React, { Fragment } from 'react'
import { Pie } from '@ant-design/plots'
import classnames from 'classnames/bind'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import useI18n from '../../../../hooks/useI18n'
import AspectTooltip from '../../../../oldComponents/shared/AspectTooltip'
import { filterColour } from '../../../index'
import messages from './messages'
import styles from './PieRowGraph.css'

const cssClasses = classnames.bind(styles)

const PieRowGraph = ({ data, componentClasses }) => {
  const { formatMessage: intlFormatMessage } = useI18n()
  const navigate = useNavigate()

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
                      {type === 'doughnut' ? (
                        <div className={cssClasses(componentClasses)} style={{ height: 120, width: 120 }}>
                          <Pie
                            {...{
                              appendPadding: 10,
                              data: [{ ...pie.value[0], id: intlFormatMessage(messages[pie.value[0].id]) }],
                              angleField: 'value',
                              colorField: 'id',
                              radius: 1,
                              innerRadius: 0.64,
                              label: { content: '' },
                              statistic: {
                                title: { customHtml: () => `` },
                                content: {
                                  offsetY: -12,
                                  style: { fontSize: '24px' },
                                  customHtml: (_, __, datum, data) => `${data[0].value}`,
                                },
                              },
                              legend: false,
                              color: () => filterColour(pie.value[0].id, undefined),
                              animation: false,
                            }}
                            onReady={plot => plot.on('plot:click', () => navigate(link))}
                          />
                        </div>
                      ) : (
                        <div className={cssClasses(componentClasses)} style={{ height: 120, width: 120 }}>
                          <Pie
                            {...{
                              appendPadding: 10,
                              data: [{ ...pie.value[0], id: intlFormatMessage(messages[pie.value[0].id]) }],
                              angleField: 'value',
                              colorField: 'id',
                              label: {
                                type: 'inner',
                                offset: '-99%',
                                style: { textAlign: 'center', fontSize: 20 },
                                autoRotate: false,
                              },
                              legend: false,
                              color: () => filterColour(pie.value[0].id, undefined),
                              animation: false,
                            }}
                            onReady={plot => plot.on('plot:click', () => navigate(link))}
                          />
                        </div>
                      )}
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
PieRowGraph.defaultProps = {
  config: {},
}

PieRowGraph.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array]).isRequired,
  componentClasses: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.object,
}

export default PieRowGraph
