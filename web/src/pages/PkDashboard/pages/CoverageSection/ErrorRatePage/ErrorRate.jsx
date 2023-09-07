import React from 'react'
import entries from 'lodash/entries'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import set from 'lodash/set'
import { useLocation } from 'react-router'
import ErrorRateFilter from '../../../../../cleanComponents/Filter/ErrorRateFilter'
import Loading from '../../../../../cleanComponents/Loading'
import useI18n from '../../../../../hooks/useI18n'
import { useFilterValues } from '../../../../../providers/FilterProvider'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import useDeviceErrors from '../../../hooks/useDeviceError'
import messages from '../../../PkDashboard.Messages'

const values = ['numberOfModules', 'cntMtbResults', 'cntMtbError', 'cntMtbInvalid', 'cntMtbNoResult']

const columns = [
  { name: 'Devices', prop: 'name' },
  { name: 'Total Modules', prop: 'numberOfModules' },
  { name: 'Total Tests', prop: 'cntMtbResults' },
  { name: 'Error Rate', prop: 'percentMtbError' },
  { name: 'Errors', prop: 'cntMtbError' },
  { name: 'Invalid', prop: 'cntMtbInvalid' },
  { name: 'No Result', prop: 'cntMtbNoResult' },
]

const childrenKey = 'children'

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
  const errorRate = data?.cntMtbError / data?.cntMtbResults

  return { ...data, percentMtbError: Number.isNaN(errorRate) ? 0 : errorRate.toPrecision(1) }
}

const makeNestedData = array => {
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

const ErrorRatePage = () => {
  const { formatMessage } = useI18n()
  const location = useLocation()
  const filter = useFilterValues(location.pathname)
  const { data, isLoading } = useDeviceErrors(filter)

  return (
    <PkPage header={<ErrorRateFilter />} title={formatMessage(messages.genExpertError)}>
      {isLoading ? (
        <Loading />
      ) : (
        <NestedTable columns={columns} perPage={9999} rows={makeNestedData(data ?? [])} hasDetail />
      )}
    </PkPage>
  )
}

export default ErrorRatePage
