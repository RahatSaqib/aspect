import filter from 'lodash/filter'
import forOwn from 'lodash/forOwn'
import max from 'lodash/max'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import round from 'lodash/round'
import sum from 'lodash/sum'
import sumBy from 'lodash/sumBy'
import values from 'lodash/values'
import { filterColour } from './index'

const calcPercentageForGraphs = (value, total, precision = 4) => ((value / total) * 100).toFixed(precision)

const getMaxValueForDivergent = data => {
  const keyValues = []
  data.map(d => values(d).map(v => Number.isInteger(v) && keyValues.push(Math.abs(v))))
  const maxVal = max(keyValues) % 2 === 0 ? max(keyValues) : max(keyValues) + 1
  return { minValue: -maxVal, maxValue: maxVal }
}

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

const percentageOrActualForPie = (data, displayMethod) => {
  let newData = []
  if (displayMethod === 'percentage') {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)
    data.map(d =>
      newData.push({
        ...d,
        value: total < 1 ? total : +calcPercentageForGraphs(d.value, total),
      })
    )
  } else {
    newData = data
  }
  return newData
}

const getAverageFromData = (data, value, which, notation, culture) => {
  if (data.length && which) {
    let totalForFilter = []
    const total = []
    data.map(d => total.push(sum(values(pick(d, value)).map(Number))))
    const totalSum = Number(sum(total))
    const totalSumAvg = which === '*' ? (totalSum / 12).toFixed(1) : totalSum
    const totalNotation = totalSumAvg > 1000 ? 'compact' : notation || 'standard'

    if (Array.isArray(which)) {
      const rangeTotal = which.reduce((acc, curr) => {
        const item = filter(data, ['label', curr])[0]
        if (item) {
          if (acc && acc.id) {
            acc[value] += parseFloat(item[value])
          } else {
            acc = {
              ...item,
              [value]: parseFloat(item[value]),
            }
          }
        } else {
          console.warn(`There are no results to match your config for item: ${curr}`)
        }
        return acc
      }, {})

      if (Object.keys(rangeTotal).length !== 0 && rangeTotal.constructor === Object) {
        totalForFilter.push(rangeTotal)
      }
    } else if (which === '*') {
      totalForFilter.push({
        id: value,
        label: value,
        value: data.reduce((acc, curr) => acc + curr.value, 0),
      })
    } else {
      totalForFilter = filter(data, ['label', which]) || [{ [value]: 0 }]
    }

    if (totalForFilter && totalForFilter.length) {
      const sumData = data.reduce((acc, curr) => acc + parseFloat(curr.value), 0)
      const avg =
        sumData < 1 ? sumData : calcPercentageForGraphs(parseFloat(totalForFilter[0][value]), round(sumData), 1)

      const avgObj = {
        avg: parseFloat(avg),
        color: filterColour(totalForFilter[0].id),
        totals: new Intl.NumberFormat(culture, {
          notation: totalNotation,
        }).format(totalSumAvg),
      }
      return avgObj
    }
    console.warn('There are no data that match your config')
  }
  return {}
}

const calcOverallRate = (keyToCalc, totalTotal, gData, filterCriteria) => {
  if (filterCriteria) {
    gData = filter(gData, filterCriteria)
  }

  const totalKey = sumBy(gData, d => Number(d[keyToCalc]))
  const total = sumBy(gData, d => Number(d[totalTotal]))
  const percentage = total > 0 ? (totalKey / total) * 100 : total
  return percentage
}

export {
  calcOverallRate,
  calcPercentageForGraphs,
  calcPercentageSplitBar,
  getAverageFromData,
  getMaxValueForDivergent,
  roundIfNumber,
  percentageOrActualForPie,
}
