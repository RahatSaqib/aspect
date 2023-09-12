import React, { useEffect, useState } from 'react'
import { TableBody, Table } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import DeviceWorkloadFilter from '../../../cleanComponents/Filter/DeviceWorkloadFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import useI18n from '../../../hooks/useI18n'
import useWorkload from '../../../hooks/workload/useWorkload'
import useWorkloadDownload from '../../../hooks/workload/useWorkloadDownload'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import colMessages from '../../../oldPages/result/list/messages'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import styles from './styles.css'
import TableRow from './TableRow'

// There are some missing translations for the status, you should check what we are actually doing in device table.
// BD MGIT columnas

const cssClasses = classnames.bind(styles)

const availableSortCol = [
  'name',
  'deviceStatus',
  'lastPingOn',
  'firstResultEndedOn',
  'lastResultEndedOn',
  'totalTests',
  'stateName',
  'lgaName',
]

const Workload = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useI18n()
  const filter = useFilterValues(location.pathname)
  const user = useAuthState()
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const sortPage = makeSortPageSelector({ sortCol: 'name', sortDir: 'asc', pageSize: 50 })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location, availableSortCol, dependencies: {} })
  const { isError, isLoading, data = false, error } = useWorkload(filter)

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
    { key: 'stateName', label: getCustomMessage(messages, 'state', user), sortable: true, hiddenOn: 'xl' },
    { key: 'lgaName', label: getCustomMessage(messages, 'lga', user), sortable: true, hiddenOn: 'xl' },
    { key: 'lastPingOn', label: formatMessage(messages.lastPingOn), sortable: true, hiddenOn: 'xl' },
    { key: 'firstResultEndedOn', label: formatMessage(messages.firstResultEndedOn), sortable: true, hiddenOn: 'xl' },
    { key: 'lastResultEndedOn', label: formatMessage(messages.lastResultEndedOn), sortable: true, hiddenOn: 'xl' },
    { key: 'totalTests', label: formatMessage(messages.totalTests), sortable: true },
    ...extraColumns.map(c => ({
      key: c.fieldId,
      label: `${formatMessage(colMessages[c.resultCategoryLabelI18nKey])} ${formatMessage(
        colMessages[c.resultCategoryI18nKey]
      )}`,
      sortable: false,
    })),
  ]
  const extraColumnsProps = extraColumns.map(ec => ec.fieldId)

  return (
    <>
      <DetailHeader name={formatMessage(messages.workloadTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.workloadTitle)} />
        <DeviceWorkloadFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExcelClick}
              visible={!!workloadList.length}
              reportName="DeviceWorkload"
            />
          </div>

          {isLoading ? (
            <DataTableProgressBar disabled={!isLoading} />
          ) : workloadList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <div style={{ overflowY: 'hidden', overflowX: 'scroll' }}>
                <Table className={cssClasses('InventoryDataTable')}>
                  <DataTableHead sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
                  <TableBody>
                    {workloadList.map((item, index) => (
                      <TableRow key={`workload--${index}`} item={item} extraColumns={extraColumnsProps} />
                    ))}
                  </TableBody>
                </Table>
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
