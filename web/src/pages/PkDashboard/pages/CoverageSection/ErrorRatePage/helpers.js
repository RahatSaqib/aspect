import entries from 'lodash/entries'
import get from 'lodash/get'
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

export const makeNestedData = array => {
  const result = []

  entries(groupBy(array, 'stateName')).forEach(([stateName, stateValues]) => {
    const state = createNode(stateName, stateValues)

    if (state.name === 'null') {
      result.push({ ...state, name: 'N/A', [childrenKey]: stateValues })
      return
    }

    entries(groupBy(stateValues, 'lgaName')).forEach(([lgaName, lgaValues]) => {
      const lga = createNode(lgaName, lgaValues)

      entries(groupBy(lgaValues, 'name')).forEach(([typeName, typeValues]) => {
        const type = createNode(typeName, typeValues)
        set(lga, childrenKey, [...get(lga, childrenKey, []), type])
      })

      set(state, childrenKey, [...get(state, childrenKey, []), lga])
    })

    result.push(state)
  })

  return result
}
