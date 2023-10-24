import React from 'react'
import entries from 'lodash/entries'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import set from 'lodash/set'
import { useLocation } from 'react-router'
import { Loading, ErrorRateFilter } from '../../../../../cleanComponents'
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
  { name: '# Errors', prop: 'cntMtbError' },
  { name: '% Errors', prop: 'errorPercent' },
  { name: '# Invalid', prop: 'cntMtbInvalid' },
  { name: '% Invalid', prop: 'invalidPercent' },
  { name: '# No Result', prop: 'cntMtbNoResult' },
  { name: '% No Result', prop: 'noResultPercent' },
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
  const errorPercent = (data?.cntMtbError / data?.cntMtbResults) * 100
  const invalidPercent = (data?.cntMtbInvalid / data?.cntMtbResults) * 100
  const noResultPercent = (data?.cntMtbNoResult / data?.cntMtbResults) * 100

  return {
    ...data,
    errorPercent: `${errorPercent.toPrecision(3)} %`,
    invalidPercent: `${invalidPercent.toPrecision(3)} %`,
    noResultPercent: `${noResultPercent.toPrecision(3)} %`,
  }
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
