import React, { useState } from 'react'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'
import entries from 'lodash/entries'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import set from 'lodash/set'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { ErrorRateFilter, LineGraph, Loading, StateSelect } from '../../../../../cleanComponents'
import useAuthState from '../../../../../hooks/useAuthState'
import useFilterValues from '../../../../../hooks/useFilterValues'
import { graphMessages, months } from '../../../../../messages'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import useDeviceErrors from '../../../hooks/useDeviceError'
import useDeviceErrorGraph from '../../../hooks/useDeviceErrorGraph'
import messages from '../../../PkDashboard.Messages'

const values = ['numberOfModules', 'cntMtbResults', 'cntMtbError', 'cntMtbInvalid', 'cntMtbNoResult']

const GroupedHeader = ({ title, first, second }) => (
  <Box style={{ width: '100%' }}>
    <Box
      sx={{
        display: 'flex',
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', mr: '-18px' }}>
        <span>{first}</span>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ flex: 1, mt: '-10px', mr: '-18px' }}>{title}</Box>
        <span>{second}</span>
      </Box>
    </Box>
  </Box>
)

const columns = [
  { name: 'Devices', prop: 'name' },
  { name: 'Total Modules', prop: 'numberOfModules' },
  { name: 'Total Tests', prop: 'cntMtbResults' },
  {
    name: <GroupedHeader title="Errors" first="#" second="%" />,
    prop: 'cntMtbError',
    rest: { colSpan: 2, align: 'center', sx: { p: 0 } },
    cellProp: { sx: { p: 0 } },
  },
  {
    name: '% Errors',
    prop: 'errorPercent',
    rest: { skip: true }, // skip rendering header for this one , because we are creating a grouped header manually
    cellProp: { style: { padding: 0 } },
  },
  {
    name: <GroupedHeader title="Invalid" first="#" second="%" />,
    prop: 'cntMtbInvalid',
    rest: { colSpan: 2, align: 'center', sx: { p: 0 } },
    cellProp: { sx: { p: 0 } },
  },
  {
    name: '% Invalid',
    prop: 'invalidPercent',
    rest: { skip: true }, // skip rendering header for this one , because we are creating a grouped header manually
    cellProp: { sx: { p: 0 } },
  },

  {
    name: <GroupedHeader title="No Result" first="#" second="%" />,
    prop: 'cntMtbNoResult',
    rest: { colSpan: 2, align: 'center', sx: { p: 0 } },
    cellProp: { sx: { p: 0 } },
  },
  {
    name: '% No Result',
    prop: 'noResultPercent',
    rest: { skip: true }, // skip rendering header for this one , because we are creating a grouped header manually
    cellProp: { sx: { p: 0 } },
  },
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

const ErrorRateGraph = ({ category, title }) => {
  const { formatMessage } = useIntl()
  const { countryId } = useAuthState()
  const [state, setState] = useState()
  const [showLabel, setShowLabel] = useState(false)
  const { data, isLoading } = useDeviceErrorGraph(omitBy({ category, state }, isNil), {
    select: array =>
      array
        .sort((a, b) => a.month - b.month)
        .map(item => ({
          year: String(item.year),
          month: `${formatMessage(months[item.month - 1])}`,
          value: item.percentage,
        })),
  })
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', my: '25px' }}>
      <Box flex={1}>
        <Typography variant="h5" color="primary">
          {title}
        </Typography>
        <FormControlLabel
          sx={{ mt: '20px' }}
          label={formatMessage(graphMessages.showValuesLabel)}
          control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
        />
        <StateSelect
          label={formatMessage(messages.state)}
          value={state || ''}
          onChange={e => setState(e.target.value)}
          countryId={countryId}
        />
      </Box>
      <Box flex={3}>
        {isLoading ? (
          <Loading />
        ) : (
          <LineGraph showLabel={showLabel} data={data} xField="month" yField="value" seriesField="year" />
        )}
      </Box>
    </Box>
  )
}

const ErrorRatePage = () => {
  const { formatMessage } = useIntl()
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
      <ErrorRateGraph title={formatMessage(messages.nationalErrorRates)} category="error" />
      <ErrorRateGraph title={formatMessage(messages.nationalInvalidRates)} category="invalid" />
      <ErrorRateGraph title={formatMessage(messages.nationalNoResultRates)} category="noResult" />
    </PkPage>
  )
}

export default ErrorRatePage
