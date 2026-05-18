import React, { useState, useEffect } from 'react'
import { Button, LinearProgress, TableBody } from '@mui/material'
import { formatInTimeZone } from 'date-fns-tz'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { DetailHeader, SampleFilter, TableContainer } from '../../components'
import BrowseEmptyList from '../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import useSamples from '../../hooks/sample/useSamples'
import useFilterValues from '../../hooks/useFilterValues'
import { makeSortPageSelector } from '../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../utils/utils/browser'
import { getTimezoneById } from '../../utils/utils/timezone'
import messages from './messages'
import { SampleDataTable, SampleDataTableHead, SampleDataTableRow } from './SampleDataTable'
import styles from './SampleList.module.css'

const SampleList = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useFilterValues(location.pathname)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'sampleCollectedOn' })({ location })
  const [isLoading, setIsLoading] = useState(true)

  const { timezoneId } = useSelector(({ user }) => user)
  const validTimeZone = getTimezoneById(timezoneId)

  const { data, isLoading: tableLoading } = useSamples(
    { sortCol, sortDir, pageAt, pageSize, filters },
    { enabled: !!sortCol }
  )

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  const tableColumns = [
    { key: 'sampleCollectionSite', label: intl.formatMessage(messages.sampleCollectionSite), sortable: false },
    { key: 'sampleCollectedOn', label: intl.formatMessage(messages.sampleCollectedOn), sortable: true },
    { key: 'sampleCollectedBy', label: intl.formatMessage(messages.sampleCollectedBy), sortable: false },
    { key: 'sampleExternalId', label: intl.formatMessage(messages.sampleId), sortable: true },
    { key: 'patientId', label: intl.formatMessage(messages.patientId), sortable: true },
    { key: 'dateUploadedToAspect', label: intl.formatMessage(messages.dateUploadedToAspect), sortable: true },
    { key: 'result', label: intl.formatMessage(messages.result), sortable: false },
    { key: 'resultDate', label: intl.formatMessage(messages.resultDate), sortable: true },
  ]

  const formatDate = dateString => {
    if (!dateString) return 'N/A'
    try {
      return formatInTimeZone(new Date(dateString), validTimeZone, 'yyyy-MM-dd')
    } catch {
      return 'N/A'
    }
  }

  const formatResult = sample => {
    if (!sample.resultId) return 'No Result'

    return (
      <Button
        onClick={() => gotoWithReturnUrl(`/browse/result/${sample.resultId}`, navigate, location)}
        variant="text"
        sx={{ p: 0, textTransform: 'none' }}
      >
        {sample.resultText || 'View Result'}
      </Button>
    )
  }

  if (isLoading) {
    return <LinearProgress />
  }

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.samplesTitle)} disableBack />
      <div className={`${styles.Container} ${styles.fullWidth}`}>
        <Helmet title={intl.formatMessage(messages.samplesTitle)} />
        <SampleFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`} sx={{ width: '100%', maxWidth: '100%' }}>
          {isLoading ? (
            <LinearProgress />
          ) : !data || !data.sampleList || data.sampleList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <TableContainer>
                <SampleDataTable className={styles.SampleDataTable}>
                  <SampleDataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={tableColumns}
                  />
                  <TableBody>
                    {data?.sampleList?.map(sample => (
                      <SampleDataTableRow
                        key={sample.sampleId}
                        sample={{
                          ...sample,
                          sampleCollectedOn: formatDate(sample.sampleCollectedOn),
                          dateUploadedToAspect: formatDate(sample.dateUploadedToAspect),
                          resultDate: formatDate(sample.resultDate),
                          result: formatResult(sample),
                        }}
                        data-sample-id={sample.sampleId}
                      />
                    ))}
                  </TableBody>
                </SampleDataTable>
              </TableContainer>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                paginatorStatus={messages.paginatorStatus}
                total={data.total}
                pageAt={pageAt}
                pageSize={pageSize}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default SampleList
