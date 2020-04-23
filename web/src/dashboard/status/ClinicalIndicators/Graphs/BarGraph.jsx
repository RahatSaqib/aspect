import React, { Fragment, useEffect, useState } from 'react';
import classnames from 'classnames/bind';
import { ResponsiveBar } from '@nivo/bar';
import { BoxLegendSvg } from '@nivo/legends';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  calcPercentageSplitBar,
  getKeysFromResults,
  groupByKey,
  makeProperCase,
  normaliseKeys,
  translateKeys
} from './Helpers';

const cssClasses = classnames.bind(require('./Graphs.css'));

const getTextWidth = (text, font) => {
  // re-use canvas object for better performance
  var canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement('canvas'));
  var context = canvas.getContext('2d');
  context.font = font;
  var metrics = context.measureText(text);
  return Math.round(metrics.width);
};

const BarLegend = ({ height, legends, width }) => {
  console.log(height, legends, width);

  return (
    <Fragment>
      {legends.map(legend => (
        <BoxLegendSvg
          key={JSON.stringify(legend.data.map(({ id }) => id))}
          {...legend}
          containerHeight={height}
          containerWidth={width}
        />
      ))}
    </Fragment>
  );
};

const BarGraph = ({
  data,
  keys: keysFromProps = false,
  indexBy,
  orderBy,
  keyToConsume,
  formatDate,
  legend,
  componentClass,
  displayMethod,
  assayFromState,
  filter = false,
  intl
}) => {
  const [graph, setGraph] = useState(false);
  const [keys, setKeys] = useState(false);
  const [filterResults] = useState(filter);

  useEffect(() => {
    if (!keysFromProps && graph) {
      const keys = getKeysFromResults(graph, indexBy, orderBy);
      setKeys(keys);
    }
  }, [graph, indexBy, keysFromProps, orderBy, intl]);

  useEffect(() => {
    if (
      !graph &&
      data.length &&
      assayFromState &&
      Object.keys(assayFromState).length
    ) {
      const grouped = groupByKey(data, indexBy, keyToConsume, formatDate, intl);
      const normalised = normaliseKeys(grouped, filterResults, indexBy);
      const display =
        displayMethod === 'percentage'
          ? calcPercentageSplitBar(normalised, indexBy)
          : normalised;
      const translated = translateKeys(display, assayFromState, true);
      // console.log(data, indexBy, keyToConsume, normalised, translated);

      setGraph([...translated]);
    }
  }, [data]);

  console.log(keys);

  return (
    <div className={cssClasses(componentClass)}>
      {graph && graph.length ? (
        <ResponsiveBar
          data={graph}
          keys={keys}
          indexBy={indexBy}
          colors={d => d.data[`${d.id}Color`]}
          tooltipFormat={value =>
            displayMethod === 'percentage'
              ? `${Number(value).toFixed(2)}%`
              : intl.formatNumber(Number(value))
          }
          colorBy="index"
          enableLabel={false}
          enableGridY={false}
          margin={
            displayMethod === 'percentage'
              ? { top: 5, right: 10, bottom: 110, left: 80 }
              : { top: 10, right: 10, bottom: 110, left: 80 }
          }
          padding={0.3}
          borderWidth={0}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            tickRotation: 0,
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={
            displayMethod === 'percentage'
              ? null
              : {
                  format: v => intl.formatNumber(v)
                }
          }
          labelSkipWidth={12}
          labelSkipHeight={12}
          animate
          motionStiffness={90}
          motionDamping={15}
          layers={['grid', 'axes', 'bars', 'markers', BarLegend]}
          legends={
            legend
              ? [
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'row',
                    justify: false,
                    translateX: -25,
                    translateY: 60,
                    itemsSpacing: 2,
                    itemWidth:
                      keys &&
                      keys.map(k => {
                        console.log(k, getTextWidth(k, 'bold 12pt arial'));
                        return getTextWidth(k, 'bold 12pt arial');
                      }),

                    data:
                      keys &&
                      keys.map(k => {
                        console.log(k);
                        return {
                          label: makeProperCase(k)
                        };
                      }),
                    itemHeight: 20,
                    itemDirection: 'right-to-left',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]
              : []
          }
        />
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};

export default BarGraph;
