import React from 'react'
import entries from 'lodash/entries'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import set from 'lodash/set'
import useI18n from '../../../../../hooks/useI18n'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import useDeviceErrors from '../../../hooks/useDeviceError'
import messages from '../../../PkDashboard.Messages'

const values = [
  'numberOfModules',
  'cntMtbResults',
  'cntMtbError',
  'cntMtbInvalid',
  'cntMtbNoResult',
  'percentMtbError',
  'percentMtbInvalid',
  'percentMtbNoResult',
]

const columns = [
  { name: 'Devices', prop: 'name' },
  { name: 'Total Modules', prop: 'numberOfModules' },
  { name: 'Total Tests', prop: 'cntMtbResults' },
  { name: 'Error Rate', prop: 'percentMtbError' },
  { name: 'Errors', prop: 'cntMtbError' },
  { name: 'Invalid', prop: 'percentMtbInvalid' },
  { name: 'No Res', prop: 'percentMtbNoResult' },
]

const childrenKey = 'children'

const createNode = (name, parent) =>
  parent.reduce(
    (prev, curr) => {
      values.forEach(key => set(prev, key, (prev?.[key] ?? 0) + (curr?.[key] ?? 0)))
      return prev
    },
    { name, id: name }
  )

const makeNestedData = array => {
  const result = []

  entries(groupBy(array, 'stateName')).forEach(([stateName, stateValues]) => {
    const state = createNode(stateName, stateValues)

    entries(groupBy(stateValues, 'lgaName')).forEach(([lgaName, lgaValues]) => {
      const lga = createNode(lgaName, lgaValues)

      entries(groupBy(lgaValues, 'type')).forEach(([typeName, typeValues]) => {
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

  const { data } = useDeviceErrors()

  return (
    <PkPage isMocked title={formatMessage(messages.errorRateTitle)}>
      <NestedTable columns={columns} rows={makeNestedData(data ?? [])} hasDetail />
    </PkPage>
  )
}

export default ErrorRatePage
