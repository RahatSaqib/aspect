import React, { useEffect, useState } from 'react'
import { TableBody, Table, LinearProgress } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, DeviceWorkloadFilter, TableContainer } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import useResultCategoryGroup from '../../../hooks/result/useResultCategoryGroup'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import useFilterValues from '../../../hooks/useFilterValues'
import useWorkload from '../../../hooks/workload/useWorkload'
import useWorkloadDownload from '../../../hooks/workload/useWorkloadDownload'
import { resultCategory } from '../../../messages'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import DataTableCard from '../../../components/shared/DataTableCard'
import DataTableHead from '../../../components/shared/tableHead'
import { XDR_RESISTANCES } from '../../../utils/consts'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import styles from './styles.module.css'
import TableRow from './TableRow'

// There are some missing translations for the status, you should check what we are actually doing in device table.
// BD MGIT columnas

const availableSortCol = [
  'name',
  'deviceStatus',
  'lastPingOn',
  'firstResultEndedOn',
  'lastResultEndedOn',
  'total',
  'stateName',
  'lgaName',
]

const Workload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useIntl()
  const filter = useFilterValues(location.pathname)
  const user = useAuthState()
  const [addFilter] = useFilterUpdate()
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const sortPage = makeSortPageSelector({ sortCol: 'name', sortDir: 'asc', pageSize: 10 })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location, availableSortCol, dependencies: {} })
  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useWorkload({ ...filter, size: pageSize, page: pageAt, sortCol, sortDir })

  const { isLoading: isresultCategoryLoading, data: resultCategoryGroups } = useResultCategoryGroup(
    filter.assayId ? [filter.assayId] : undefined,
    {
      enabled: !!filter.assayId,
    }
  )

  if (isError) throw new Error(error)

  useWorkloadDownload({ ...filter, ...download })
  const onExcelClick = formatType => setDownload({ fileFormat: formatType, enabled: true })

  useEffect(() => {
    if (download.enabled) {
      setDownload({ fileFormat: '', enabled: false })
    }
  }, [download])

  const { data: workloadList, total, extraColumns } = data || { data: [], total: 0, extraColumns: [] }

  const columns = [
    { key: 'name', label: formatMessage(messages.name), sortable: true },
    { key: 'deviceStatus', label: formatMessage(messages.deviceStatus), sortable: true, hiddenOn: 'xl' },
    {
      key: 'stateName',
      label: getCustomMessage(formatMessage, messages, 'state', user),
      sortable: true,
      hiddenOn: 'xl',
    },
    { key: 'lgaName', label: getCustomMessage(formatMessage, messages, 'lga', user), sortable: true, hiddenOn: 'xl' },
    { key: 'lastPingOn', label: formatMessage(messages.lastPingOn), sortable: true, hiddenOn: 'xl' },
    { key: 'firstResultEndedOn', label: formatMessage(messages.firstResultEndedOn), sortable: true, hiddenOn: 'xl' },
    { key: 'lastResultEndedOn', label: formatMessage(messages.lastResultEndedOn), sortable: true, hiddenOn: 'xl' },
    { key: 'total', label: formatMessage(messages.totalTests), sortable: true },
    ...extraColumns.map(c => ({
      key: c.fieldId,
      label: c.label,
      sortable: false,
    })),
  ]
  const extraColumnsProps = extraColumns.map(ec => ec.fieldId)

  const onColumnClick = ({ deviceName, fieldId, deviceId }) => {
    if (deviceId) {
      navigate(`/browse/device/list/${deviceId}`, { state: { previousLocationPathname: location.pathname } })
      return
    }

    let column = fieldId && columns.find(col => col.key.toLowerCase() === fieldId.toLowerCase()).label.toLowerCase()
    const resultGroupId =
      fieldId &&
      resultCategoryGroups.find(categoryGroup => {
        const columnName = categoryGroup.name.toLowerCase().replace(' - ', ' ')
        const isXdrCase = XDR_RESISTANCES.some(resistance => column.includes(resistance.toLowerCase()))

        if (isXdrCase && categoryGroup.assayI18nKey === 'assayGeneXpertMtbXdr') {
          column = formatMessage(resultCategory.gxMtbXdrMtbDetectedXdrDetected).toLowerCase()
        }
        return columnName === column || columnName.includes(column)
      })?.externalId

    const { minDate, maxDate } = filter
    const baseUrl = '/browse/result'
    addFilter(
      {
        minDate,
        maxDate,
        ...(filter.assayId ? { assayId: [filter.assayId] } : {}),
        resultCategoryGroupId: resultGroupId ?? null,
        deviceName,
      },
      baseUrl
    )
    navigate(baseUrl)
  }
  return (
    <>
      <DetailHeader name={formatMessage(messages.workloadTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.workloadTitle)} />
        <DeviceWorkloadFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`} className={styles.DataTableCard__table}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExcelClick}
              visible={!!workloadList.length}
              reportName="DeviceWorkload"
            />
          </div>

          {isLoading || isresultCategoryLoading ? (
            <LinearProgress />
          ) : workloadList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <div style={{ overflowY: 'hidden', overflowX: 'scroll' }}>
                <TableContainer>
                  <Table className={styles.InventoryDataTable}>
                    <DataTableHead sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
                    <TableBody>
                      {workloadList.map((item, index) => (
                        <TableRow
                          key={`workload--${index}`}
                          item={item}
                          extraColumns={extraColumnsProps}
                          onColumnClick={onColumnClick}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                pageSizeButtonKeys={[10, 25, 50, 100]}
                paginatorStatus={messages.paginatorStatus}
                total={total}
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

export default Workload
