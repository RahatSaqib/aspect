import forOwn from 'lodash/forOwn'
import omit from 'lodash/omit'
import sum from 'lodash/sum'
import values from 'lodash/values'

const calcPercentageForGraphs = (value, total, precision = 4) => ((value / total) * 100).toFixed(precision)

const roundIfNumber = value => (typeof value === 'number' && value > 0 ? Math.round(value) : value)

const calcPercentageSplitBar = (data, keyToOmit, displayMethod, precision = 4) => {
  return displayMethod === 'actual'
    ? data
    : data.map(d => {
        const dSum = sum(values(omit(d, keyToOmit)))
        forOwn(d, (value, key) => {
          if (key !== keyToOmit) {
            d[key] = +calcPercentageForGraphs(value, dSum, precision)
          }
        })
        d.totalCnt = dSum
        return d
      })
}

export { calcPercentageForGraphs, calcPercentageSplitBar, roundIfNumber }
