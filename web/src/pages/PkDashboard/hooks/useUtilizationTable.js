import entries from 'lodash/entries'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import round from 'lodash/round'
import set from 'lodash/set'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'

const values = ['modules', 'cnt', 'rate', 'dailyCapacity']
const childrenKey = 'children'
export function useUtilizationTable(filters) {
  const { isLoading: isLoadingTable, data: tableData } = useQuery(
    ['tblUtilizationPage_National', filters],
    async () =>
      fetchWrapperForQueries({
        endpoint: '/device/annual-utilization-rate-national',
        params: filters,
      }),
    {
      select: ({ data: array = [], WORKING_DAYS_IN_YEAR }) => {
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
          return { ...data, rate: round((data.cnt * 100) / Math.max(data.dailyCapacity * WORKING_DAYS_IN_YEAR, 1), 2) }
        }
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
      },
    }
  )

  return {
    tableData,
    isLoadingTable,
  }
}
