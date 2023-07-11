import React, { useState, useEffect } from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import isEmpty from 'lodash/isEmpty'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import ReporterFilter from '../../../cleanComponents/Filter/ReporterFilter'
import AspectExportListButton from '../../../components/AspectExportListButton'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useFilterValues } from '../../../providers/FilterProvider'
import { receiveList, Items } from '../../../utils/metaReducers/items'
import { receiveTableItems, Table } from '../../../utils/metaReducers/table'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { getExportableFile, REPORTERS_LIST, REPORTERS_LIST_REVOKE_ONE } from '../ReporterQueries'
import messages from './messages'
import { ReporterDataTable, ReporterDataTableHead, ReporterDataTableRow } from './ReporterDataTable'
import styles from './ReporterList.css'

const cssClasses = classnames.bind(styles)

const getBaseColumns = formatMessage => {
  return Immutable.List([
    {
      key: 'siteName',
      label: formatMessage(messages.siteName),
      sortable: true,
    },
    {
      key: 'totalResults',
      label: formatMessage(messages.totalResults),
      sortable: true,
    },
    {
      key: 'delivered',
      label: formatMessage(messages.delivered),
      sortable: true,
    },
    {
      key: 'requiresTreatment',
      label: formatMessage(messages.requiresTreatment),
      sortable: true,
    },
    {
      key: 'onTreatment',
      label: formatMessage(messages.onTreatment),
      sortable: true,
    },
    {
      key: 'transferred',
      label: formatMessage(messages.transferred),
      sortable: true,
    },
    {
      key: 'notPossible',
      label: formatMessage(messages.notPossible),
      sortable: true,
    },
    {
      key: 'notOnTreatment',
      label: formatMessage(messages.notOnTreatment),
      sortable: true,
    },
  ])
}

const getCurrentPagination = location => {
  const sortPage = makeSortPageSelector({
    sortCol: 'siteName',
    sortDir: 'asc',
  })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  return { sortCol, sortDir, page: pageAt, size: pageSize }
}

export const ReporterListWithProps = ({
  navigate,
  location,
  table,
  columns,
  items,
  isLoading,
  sortCol,
  sortDir,
  pageAt,
  onExportClick,
  pageSize,
}) => {
  const { formatMessage } = useI18n()

  return (
    <>
      <DetailHeader name={formatMessage(messages.reportersTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.reportersTitle)} />
        <ReporterFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton
              onExport={onExportClick}
              visible={!items.currentIdList.isEmpty()}
              reportName="Reporters"
            />
          </div>
          <DataTableProgressBar disabled={!isLoading} />

          {items.currentIdList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <ReporterDataTable className={cssClasses('ReporterDataTable')}>
                <ReporterDataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={columns}
                />
                <TableBody>
                  {items.currentIdList
                    .map(id => items.byId.get(id))
                    .map(reporter => (
                      <ReporterDataTableRow key={reporter.get('siteId')} reporter={reporter} />
                    ))}
                </TableBody>
              </ReporterDataTable>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                className={cssClasses('BrowseTablePaginator')}
                paginatorStatus={messages.paginatorStatus}
                total={table.total}
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

const ReporterList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const filters = useFilterValues(location.pathname)

  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(
    new Table({
      sortCol: 'siteName',
      sortDir: 'asc',
      filters: Immutable.fromJS({
        assayId: null,
      }),
      extraColumns: Immutable.List(),
    })
  )
  const [total, setTotal] = useState()
  const [pagination, setPagination] = useState(getCurrentPagination(location))
  const [columns, setColumns] = useState(Immutable.List([]))
  const { formatMessage } = useI18n()

  const { sortCol, sortDir, page, size } = pagination
  const params = { ...pagination, ...filters }

  const { mutate: onRevokedItem, isLoading: isLoadingRevoke } = useMutation(
    async ({ id, revoked }) =>
      fetchWrapperForQueries({
        endpoint: `${REPORTERS_LIST_REVOKE_ONE.ENDPOINT}/${id}`,
        method: 'PUT',
        params: { revoked },
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([REPORTERS_LIST.KEY, { params }])
      },
    }
  )

  const { isLoading, isError, data, error } = useQuery(
    [REPORTERS_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: REPORTERS_LIST.ENDPOINT,
        params,
      }),
    { enabled: !isEmpty(params) }
  )

  useEffect(() => {
    setPagination(getCurrentPagination(location))
  }, [location])

  useEffect(() => {
    if (data) {
      const { data: list, total: totalItems } = data
      setItems(receiveList(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      setTable(receiveTableItems(table, totalItems))
      setColumns(getBaseColumns(formatMessage))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const onExportClick = formatType => {
    return getExportableFile(filters, formatType, sortCol, sortDir, data.total, 'Reporters')
  }

  const baseProps = {
    navigate,
    location,
    isLoading: isLoading || isLoadingRevoke,
    items,
    sortCol,
    sortDir,
    columns,
    onExportClick,
    onRevokedItem,
    table,
    total,
    pageAt: page,
    pageSize: size,
  }

  if (isError) throw new Error(error)

  return <ReporterListWithProps {...baseProps} />
}

ReporterListWithProps.propTypes = {
  navigate: PropTypes.func.isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  table: PropTypes.instanceOf(Immutable.Record).isRequired,
  items: PropTypes.instanceOf(Immutable.Record).isRequired,
  sortCol: PropTypes.string.isRequired,
  sortDir: PropTypes.string.isRequired,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onExportClick: PropTypes.func.isRequired,
  columns: PropTypes.instanceOf(Immutable.List).isRequired,
  isLoading: PropTypes.bool.isRequired,
}

export default ReporterList
