import entries from 'lodash/entries'
import groupBy from 'lodash/groupBy'
import set from 'lodash/set'

const childrenKey = 'children'
const values = ['numberOfModules', 'cntMtbResults', 'cntMtbError', 'cntMtbInvalid', 'cntMtbNoResult']

const calculatePercentages = data => {
  const errorPercent = (data?.cntMtbError / data?.cntMtbResults) * 100 || 0
  const invalidPercent = (data?.cntMtbInvalid / data?.cntMtbResults) * 100 || 0
  const noResultPercent = (data?.cntMtbNoResult / data?.cntMtbResults) * 100 || 0

  return {
    errorPercent: `${errorPercent.toFixed(1)} %`,
    invalidPercent: `${invalidPercent.toFixed(1)} %`,
    noResultPercent: `${noResultPercent.toFixed(1)} %`,
  }
}

const createNode = (name, parent) => {
  const data = parent.reduce(
    (prev, curr) => {
      values.forEach(key => {
        const sum = (prev?.[key] ?? 0) + (curr?.[key] ?? 0)
        set(prev, key, Number(sum.toFixed(2)))
      })
      return prev
    },
    { name, id: name }
  )
  const percentages = calculatePercentages(data)

  return {
    ...data,
    ...percentages,
  }
}

export const makeNestedData = (array, nestingProperties, defaultName) => {
  const rootNodes = []
  const total = values.reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {})

  const nestData = (parentNode, data, properties, level) => {
    if (level >= properties.length) return
    entries(groupBy(data, properties[level])).forEach(([groupName, groupValues]) => {
      const node = createNode(groupName !== 'null' ? groupName : defaultName, groupValues)
      nestData(node, groupValues, properties, groupName !== 'null' ? level + 1 : nestingProperties.length - 1)
      if (parentNode) set(parentNode, childrenKey, [...(parentNode?.children ?? []), node])
      else rootNodes.push(node)
    })
  }

  nestData(null, array, nestingProperties, 0)

  rootNodes.forEach(node => {
    values.forEach(key => {
      total[key] += node[key]
    })
  })

  const totalSum = {
    ...total,
    ...calculatePercentages(total),
  }

  return { rootNodes, totalSum }
}
