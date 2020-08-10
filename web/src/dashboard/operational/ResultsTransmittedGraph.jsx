import React, { useEffect } from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'

import random from 'lodash/random'
import { connect } from 'react-redux'

import Card from '@material-ui/core/Card'
import { ResponsivePie } from '@nivo/pie'
import { FaArrowDown, FaArrowUp } from 'react-icons/fa'

import AspectCard from '../../MigratedComponents/AspectCard'
import { fetchResultsTransmitted } from '../DashboardRedux'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'
import { GraphToolTip } from '../../MigratedComponents/Graphs/GraphToolTip'

const cssClasses = classnames.bind(require('./ResultsTransmittedGraph.css'))

const enhance = flowRight(
  requirePermissions({
    permissions: ['dashboard', 'operationalData'],
  }),
  connect(
    state => ({
      graph: state.dashboard.get('resultsTransmitted').toJS(),
    }),
    {
      fetchResultsTransmitted,
    }
  ),
  React.memo
)

const dumbValueForZero = 999999999
const Pie = ({ data, innerRadius }) => {
  return (
    <div className={cssClasses('ResultsTransmitted__Pie__container')}>
      <ResponsivePie
        data={data}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        innerRadius={innerRadius}
        enableRadialLabels={false}
        enableSlicesLabels={false}
        padAngle={-1}
        startAngle={0}
        cornerRadius={2}
        borderWidth={0}
        borderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
        animate
        motionStiffness={90}
        motionDamping={15}
        colors={({ color }) => color}
        tooltip={() => (
          <GraphToolTip
            className={cssClasses('ResultsTransmitted__PieTooltip_container')}
            values={data.map(d => {
              let { value } = d
              if (value === dumbValueForZero) {
                value = 0
              }
              return {
                color: d.color,
                displayId: d.label,
                displayValue: `${value}${d.isPercent ? '%' : ''}`,
              }
            })}
          />
        )}
      />
    </div>
  )
}

export const ResultsTransmittedGraph = ({
  intl,
  className,
  location,
  fetchResultsTransmitted,
  graph: { currentMonth = new Date(), data = [] },
}) => {
  const onInitialLoad = () => {
    // const searchParams = new URLSearchParams(location.search)
    // const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    fetchResultsTransmitted()
  }

  useEffect(() => {
    onInitialLoad()
  }, [])

  const renderLabel = ({ value, change, isPercent }) => {
    const ArrowIcon = change > 0 ? FaArrowUp : FaArrowDown
    const valueClassName = ['ResultsTransmitted__Value']
    if (!isPercent) {
      valueClassName.push('ResultsTransmitted__PieLabel_White')
    }
    return (
      <div className={cssClasses('ResultsTransmitted__PieLabel')}>
        <div className={cssClasses(...valueClassName)}>
          {value}
          {isPercent && '%'}
        </div>
        {change !== null && (
          <div className={cssClasses('ResultsTransmitted__Change')}>
            {change !== 0 && <ArrowIcon />} {Math.abs(change)} %
          </div>
        )}
      </div>
    )
  }

  const renderPie = ({
    change = null,
    color,
    isPercent = false,
    label,
    value = 0,
  }) => {
    // value = random(0, 100)
    // if (isPercent) change = random(-20, 20)

    const innerRadius = isPercent ? 0.7 : 0
    if (!color) {
      color = isPercent ? '#99D25D' : '#000'
    }
    const data = [{ color, isPercent, label, value }]

    if (isPercent) {
      data.push({
        // grey color of remaining percents
        color: '#D8D8D8',
        isPercent,
        label: 'Percent Other Results',
        value: 100 - data[0].value,
      })
    } else if (data[0].value === 0) {
      data[0].value = dumbValueForZero
    }
    return (
      <>
        <Pie data={data} innerRadius={innerRadius} />
        {renderLabel({ value, change, isPercent })}
      </>
    )
  }

  return (
    <AspectCard
      className={classnames(cssClasses('ResultsTransmitted__Card'), {
        [className]: !!className,
      })}
      title={intl.formatMessage(messages.resultsTransmittedTitle)}
      action={currentMonth => fetchResultsTransmitted(currentMonth)}
      // actionComponent={{
      //   component: CardSelectors,
      //   props: {
      //   },
      // }}
    >
      <div className={cssClasses('ResultsTransmitted__Grid_Wrapper')}>
        <table className={cssClasses('ResultsTransmitted__Grid')}>
          <thead>
            <tr>
              <th>{intl.formatMessage(messages.assayName)}</th>
              <th>{intl.formatMessage(messages.totalResults)}</th>
              <th>{intl.formatMessage(messages.totalPositiveResults)}</th>
              <th>{intl.formatMessage(messages.percentPositiveResults)}</th>
              <th>{intl.formatMessage(messages.percentReported)}</th>
              <th>{intl.formatMessage(messages.sentViaSms)}</th>
              <th>{intl.formatMessage(messages.sentViaEmail)}</th>
              <th>{intl.formatMessage(messages.withinTwoHoursOfTesting)}</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              return (
                <tr>
                  <td>
                    <div
                      className={cssClasses('ResultsTransmitted__AssayName')}
                    >
                      {item.assayName}
                    </div>
                  </td>
                  <td>
                    {renderPie({
                      value: item.cntAll,
                      color: '#1EA1B2',
                      label: 'Total Results',
                    })}
                  </td>
                  <td>
                    {renderPie({
                      value: item.cntPositive,
                      color: '#DA3018',
                      label: 'Total Positive Results',
                    })}
                  </td>
                  <td>
                    {renderPie({
                      value: item.percentReported,
                      change: item.percentReportedChange,
                      color: '#FF2000',
                      isPercent: true,
                      label: 'Percent Positive Results',
                    })}
                  </td>

                  <td>
                    {renderPie({
                      value: item.percentReported,
                      change: item.percentReportedChange,
                      color: '#99D25D',
                      isPercent: true,
                      label: 'Percent Reported Results',
                    })}
                  </td>

                  <td>
                    {renderPie({
                      value: item.percentViaEmail,
                      change: item.percentViaEmailChange,
                      color: '#99D25D',
                      isPercent: true,
                      label: intl.formatMessage(messages.sentViaSms),
                    })}
                  </td>
                  <td>
                    {renderPie({
                      value: item.percentViaSms,
                      change: item.percentViaSmsChange,
                      color: '#99D25D',
                      isPercent: true,
                      label: intl.formatMessage(messages.sentViaEmail),
                    })}
                  </td>
                  <td>
                    {renderPie({
                      value: item.percentWithin2Hours,
                      change: item.percentWithin2HoursChange,
                      color: '#99D25D',
                      isPercent: true,
                      label: intl.formatMessage(
                        messages.withinTwoHoursOfTesting
                      ),
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AspectCard>
  )
}

export default enhance(ResultsTransmittedGraph)
