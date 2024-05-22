import entries from 'lodash/entries'
import groupBy from 'lodash/groupBy'
import set from 'lodash/set'

const childrenKey = 'children'
const values = ['numberOfModules', 'cntMtbResults', 'cntMtbError', 'cntMtbInvalid', 'cntMtbNoResult']

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
  const errorPercent = (data?.cntMtbError / data?.cntMtbResults) * 100 || 0
  const invalidPercent = (data?.cntMtbInvalid / data?.cntMtbResults) * 100 || 0
  const noResultPercent = (data?.cntMtbNoResult / data?.cntMtbResults) * 100 || 0

  return {
    ...data,
    errorPercent: `${errorPercent.toFixed(1)} %`,
    invalidPercent: `${invalidPercent.toFixed(1)} %`,
    noResultPercent: `${noResultPercent.toFixed(1)} %`,
  }
}

export const makeNestedData = (array, nestingProperties) => {
  const rootNodes = []

  const nestData = (parentNode, data, properties, level) => {
    if (level >= properties.length) return
    entries(groupBy(data, properties[level])).forEach(([groupName, groupValues]) => {
      const node = createNode(groupName, groupValues)
      nestData(node, groupValues, properties, level + 1)
      if (parentNode) set(parentNode, childrenKey, [...(parentNode?.children ?? []), node])
      else rootNodes.push(node)
    })
  }

  nestData(null, array, nestingProperties, 0)

  return rootNodes
}
