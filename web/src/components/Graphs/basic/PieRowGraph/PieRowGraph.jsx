import React, { Fragment } from 'react'
import { Pie } from '@ant-design/plots'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import messages from '../../../../messages/allMessages'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { filterColour } from '../../../index'
import styles from './PieRowGraph.module.css'

const PieRowGraph = ({ data, componentClasses }) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  const navigate = useNavigate()

  const headings = graphData => map(graphData[0], 'heading')
  const getRowKey = rowIndex => `row-${rowIndex}`

  return (
    <div className={styles.piegraph__container}>
      {data && data.length ? (
        <Fragment>
          <div className={`${styles.piegraphs__row} ${styles.piegraphs__row__header}`}>
            {headings(data).map(heading => (
              <div key={heading} className={styles.piegraphs__column}>
                <div className={styles.piegraphs__columnTitle}>
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
            <div key={getRowKey(rowIndex)} className={styles.piegraphs__row}>
              {row.map(pie => {
                const { value, type, link, heading } = pie
                return (
                  <div key={`${heading}-${type}`} className={styles.piegraphs__column}>
                    <div className={styles.piegraphs__columnGraph}>
                      {type === 'string' ? <div className={styles.piegraphs__rowTitle}>{value[0].value}</div> : null}
                      {type === 'doughnut' ? (
                        <div className={styles[componentClasses]} style={{ height: 120, width: 120 }}>
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
                        <div className={styles[componentClasses]} style={{ height: 120, width: 120 }}>
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
