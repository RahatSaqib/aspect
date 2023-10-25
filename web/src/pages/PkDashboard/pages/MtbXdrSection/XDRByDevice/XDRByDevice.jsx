import React from 'react'
import { TableBody, Table, Button, LinearProgress } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, XDRByDeviceFilter } from '../../../../../cleanComponents'
import useAssayList from '../../../../../hooks/assay/useAssayList'
import useXdrStatus from '../../../../../hooks/result/useXdrStatus'
import useI18n from '../../../../../hooks/useI18n'
import { getCustomMessage } from '../../../../../messages/customMessages'
import BrowseEmptyList from '../../../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../../../oldComponents/shared/DataTableCard'
import DataTableHead from '../../../../../oldComponents/shared/tableHead'
import { useAuthState } from '../../../../../providers/AuthProvider'
import { useFilterUpdate, useFilterValues } from '../../../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../../../utils/selectors/searchParams'
import messages from './messages'
import styles from './styles.css'
import TableRow from './TableRow'

const cssClasses = classnames.bind(styles)

const XdrByDevice = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useI18n()
  const filter = useFilterValues(location.pathname)
  const workloadFilter = useFilterValues('/browse/device/workload')
  const [addFilter] = useFilterUpdate()
  const user = useAuthState()
  const { data: assays } = useAssayList()

  const sortPage = makeSortPageSelector({ sortCol: 'cntAll', sortDir: 'desc', pageSize: 10 })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol: ['cntAll'],
    dependencies: {},
  })
  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useXdrStatus({ ...filter, sortCol, sortDir, page: pageAt, size: pageSize })

  if (isError) throw new Error(error)

  const { data: XdrByDevice, total } = data || { data: [], total: 0 }

  const isNational = isEmpty(filter.stateId)
  const isProvince = !isEmpty(filter.stateId) && isEmpty(filter.lgaId)
  const isDistrict = !isEmpty(filter.stateId) && !isEmpty(filter.lgaId)

  const label = isNational
    ? getCustomMessage(messages, 'state', user)
    : isProvince
    ? getCustomMessage(messages, 'lga', user)
    : formatMessage(messages.site)

  const columns = [
    { key: 'locationName', label },
    { key: 'isPmdt', label: formatMessage(messages.pmdtSites) },
    { key: 'hasPerformedXdr', label: formatMessage(messages.totalConducted) },
    { key: 'cntAll', label: formatMessage(messages.cntAll) },
    { key: 'cnt_mtb', label: formatMessage(messages.cnt_mtb) },
    { key: 'cnt_mtb_p', label: formatMessage(messages.cnt_mtb_p) },
    { key: 'cnt_inh', label: formatMessage(messages.cnt_inh) },
    { key: 'cnt_inh_p', label: formatMessage(messages.cnt_inh_p) },
    { key: 'cnt_flq', label: formatMessage(messages.cnt_flq) },
    { key: 'cnt_flq_p', label: formatMessage(messages.cnt_flq_p) },
    { key: 'cnt_amk', label: formatMessage(messages.cnt_amk) },
    { key: 'cnt_amk_p', label: formatMessage(messages.cnt_amk_p) },
    { key: 'cnt_eth', label: formatMessage(messages.cnt_eth) },
    { key: 'cnt_eth_p', label: formatMessage(messages.cnt_eth_p) },
    { key: 'error', label: formatMessage(messages.error) },
    { key: 'invalid', label: formatMessage(messages.invalid) },
    { key: 'noResult', label: formatMessage(messages.noResult) },
  ]
  if (isDistrict) {
    delete columns[1]
    delete columns[2]
  }

  return (
    <>
      <DetailHeader name={formatMessage(messages.XDRAssayResultsSummary)} />
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.XDRAssayResultsSummary)} />
        <XDRByDeviceFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                const GxMtbXdrId = assays.find(a => a.externalId === 'GxMtbXdr').id
                addFilter({ ...workloadFilter, singleAssayId: GxMtbXdrId }, '/browse/device/workload')
                navigate('/browse/device/workload')
              }}
              className={cssClasses('export-icon-button')}
            >
              {formatMessage(messages.goTo)}
            </Button>
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : XdrByDevice.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <div>
                <Table className={cssClasses('InventoryDataTable')}>
                  <DataTableHead sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
                  <TableBody>
                    {XdrByDevice.map((item, index) => (
                      <TableRow key={`xdrsummary--${index}`} item={item} isDistrict={isDistrict} />
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

export default XdrByDevice
