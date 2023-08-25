import React, { useState } from 'react'
import { FormControlLabel, Grid, Switch } from '@mui/material'
import { LgaSelect, StateSelect } from '../../../../../cleanComponents'
import Loading from '../../../../../cleanComponents/Loading'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage, graphMessages } from '../../../../../messages'
import { getCurrentYear } from '../../../../../oldComponents/shared/DateTimeInput/utils/date'
import TestsOverTimeGraphMain from '../../../../../oldPages/dashboard/Graphs/TestsOverTimeGraph/TestsOverTimeGraph.Main'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { objectToArray } from '../../../../../utils/utils/misc'
import PkPage from '../../../components/PkPage'
import TripleCardSide from '../../../components/TripleCardSide'
import { useMtpRifResults } from '../../../hooks/useMtpRifResults'
import messages from '../../../PkDashboard.Messages'
import TestsOverTimeGraphHalf from './CurrentDiagnosisGraph.Half'

const { startDate: minDate, endDate: maxDate } = getCurrentYear('yyyy-MM-dd')

const defaultFilters = [
  { groupBy: 'month' },
  { groupBy: 'assay' },
  { resultCategory1: 'Detected' },
  { minDate },
  { maxDate },
  { flags: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR' },
  { flags: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR' },
  { flags: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS' },
]

const pieGraphParams = [{ groupBy: 'resultCategory1' }, { minDate }, { maxDate }]

const CurrentDiagnosisGraphPage = () => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const [showLabel, setShowLabel] = useState(true)
  const [filter, setFilter] = useState()
  const { data: assays } = useAssayList()
  const { data: mainData, isLoading: isLoadingMain } = useMtpRifResults(objectToArray(filter).concat(defaultFilters))
  const { data: pieData, isLoading: isLoadingPie } = useMtpRifResults(objectToArray(filter).concat(pieGraphParams))

  return (
    <PkPage
      title={formatMessage(messages.peopleDiagnosedRif)}
      filters={
        <>
          <FormControlLabel
            sx={{ minWidth: '145px' }}
            label={formatMessage(graphMessages.showValuesLabel)}
            control={<Switch checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />}
          />
          <StateSelect
            value={filter?.stateId ?? ''}
            countryId={user.countryId}
            onChange={e => setFilter({ stateId: e.target.value })}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
          />
          <LgaSelect
            value={filter?.lgaId ?? ''}
            stateId={filter?.stateId}
            onChange={e => setFilter(prv => ({ ...prv, lgaId: e.target.value }))}
            label={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
          />
        </>
      }
    >
      <Grid container sx={{ mt: 2 }}>
        {isLoadingMain ? (
          <Loading />
        ) : (
          <>
            <TestsOverTimeGraphMain
              title={formatMessage(messages.tbCasesDiagnosed)}
              data={mainData.data}
              assaysFromState={assays}
              showLabel={showLabel}
            />
            <TripleCardSide
              data={[
                { label: formatMessage(messages.xdrCasesPerYear), value: `${mainData?.totalResultsCurrentYear}` },
                {
                  label: formatMessage(messages.xdrAverageMoth),
                  value: `${mainData?.averageTestsPerMonthCurrentYear}`,
                },
                { label: formatMessage(messages.xdrLastDay), value: `${mainData?.totalResultsInLast24Hours}` },
              ]}
            />
          </>
        )}

        {isLoadingPie ? (
          <Loading />
        ) : (
          <TestsOverTimeGraphHalf data={pieData?.data} assaysFromState={assays} showLabel={showLabel} />
        )}
      </Grid>
    </PkPage>
  )
}

export default CurrentDiagnosisGraphPage
