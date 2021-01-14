import React, { Fragment, useMemo, useEffect, useState } from 'react'
import { array, object, oneOfType } from 'prop-types'
import { usePaginatedQuery } from 'react-query'
import { useHistory, useLocation } from 'react-router-dom'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import isEqual from 'lodash/isEqual'

import {
  useTable,
  useSortBy,
  usePagination,
  useColumnOrder,
  useGroupBy,
  useExpanded,
} from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import fetchWrapperForQueries from '../QueryFetch'
import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import TableHeaderRow from './TableHeader/TableHeaderRow'
import TableBodyRow from './TableBody/TableBodyRow'

import AspectTablePagination from './TablePagination'
import AspectTableReset from './TableReset'

import {
  buildColumnsFromData,
  determineSortDirection,
  getCurrentColumnIndexAndShift,
  getParamsFromUrl,
  removeNullFromCollection,
  useUrlQuery,
} from './Helpers'

const cssClasses = classnames.bind(require('./Table.css'))

const AspectTableCore = ({
  config,
  tableData,
  isFetching,
  initialState,
  setters,
}) => {
  const {
    handleClearParams,
    setSize,
    setSortCol,
    setSortDir,
    setPage,
  } = setters
  const { total, data } = tableData
  const { name } = config
  const {
    columns,
    initialSortBy,
    columnOrder: { allow: allowColumnReOrder, initialOrder } = false,
    contextualMenu: ContextualMenu,
  } = useMemo(() => buildColumnsFromData(config), [config])

  const {
    canNextPage,
    canPreviousPage,
    getTableProps,
    gotoPage,
    headerGroups,
    nextPage,
    page,
    pageCount,
    prepareRow,
    previousPage,
    setColumnOrder,
    setPageSize,
    setSortBy,
    toggleGroupBy,
    toggleHideColumn,
    visibleColumns,
    state: {
      pageIndex,
      pageSize,
      sortBy,
      columnOrder,
      hiddenColumns,
      groupBy,
      expanded,
    },
  } = useTable(
    { columns, data, initialState },
    useColumnOrder,
    useGroupBy,
    useSortBy,
    useExpanded,
    usePagination
  )

  const handleChangeRowsPerPage = val => {
    setPageSize(typeof val !== 'number' ? total : Number(val))
  }

  const handleChangeColumnOrder = (e, direction, index) => {
    e.stopPropagation()
    setColumnOrder(
      getCurrentColumnIndexAndShift(visibleColumns, direction, index)
    )
  }

  const handleHideColumnToggle = (e, id) => {
    e.stopPropagation()
    toggleHideColumn(id)
  }

  const handleGroupByColumnToggle = (e, id) => {
    e.stopPropagation()
    toggleGroupBy(id)
  }

  useEffect(() => {
    const { pageSize: initialStatePageSize } = initialState
    if (pageSize !== initialStatePageSize) {
      setSize(pageSize)
    }
  }, [pageSize, setSize, initialState])

  useEffect(() => {
    const { pageIndex: initialStatePageIndex } = initialState
    if (pageIndex !== initialStatePageIndex) {
      setPage(pageIndex)
    }
  }, [pageIndex, setPage, initialState])

  useEffect(() => {
    const { sortBy: initialStateSortBy } = initialState
    if (!sortBy.length && initialSortBy) {
      setSortBy([initialSortBy])
    }
    if (sortBy.length && !isEqual(sortBy, initialStateSortBy)) {
      setSortCol(sortBy[0].id)
      setSortDir(sortBy[0].desc ? 'desc' : 'asc')
    }
  }, [sortBy, setSortBy, initialSortBy, initialState, setSortCol, setSortDir])

  useEffect(() => {
    if (visibleColumns && !columnOrder.length) {
      setColumnOrder(initialOrder)
    }
  }, [
    visibleColumns,
    allowColumnReOrder,
    columnOrder,
    initialOrder,
    setColumnOrder,
  ])

  return (
    <Fragment>
      {initialState.allowReset ? (
        <AspectTableReset isFetching={isFetching} action={handleClearParams} />
      ) : null}
      {hiddenColumns && hiddenColumns.length ? (
        <TableHiddenColumns
          columns={columns}
          hiddenColumns={hiddenColumns}
          handleHideColumnToggle={handleHideColumnToggle}
        />
      ) : null}
      <Table {...getTableProps()} style={{ tableLayout: 'auto' }}>
        <TableHead>
          {headerGroups &&
            headerGroups.map(({ headers, getHeaderGroupProps }) => (
              <TableRow {...getHeaderGroupProps()}>
                <TableHeaderRow
                  allowColumnReOrder={allowColumnReOrder}
                  handleChangeColumnOrder={handleChangeColumnOrder}
                  handleHideColumnToggle={handleHideColumnToggle}
                  handleGroupByColumnToggle={handleGroupByColumnToggle}
                  headers={headers}
                />
                {ContextualMenu ? <TableCell /> : null}
              </TableRow>
            ))}
        </TableHead>
        <TableBody>
          {page.map(row => {
            prepareRow(row)
            const {
              getRowProps,
              cells,
              getToggleRowExpandedProps,
              isExpanded,
              subRows,
            } = row
            return (
              <TableRow {...getRowProps()}>
                <TableBodyRow
                  cells={cells}
                  getToggleRowExpandedProps={getToggleRowExpandedProps}
                  isExpanded={isExpanded}
                  subRows={subRows}
                />
                {ContextualMenu ? (
                  <TableCell>
                    <ContextualMenu item={row} />
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <AspectTablePagination
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={total}
        expanded={expanded}
        gotoPage={gotoPage}
        groupBy={groupBy}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        name={name}
        nextPage={nextPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        previousPage={previousPage}
        page={page}
      />
    </Fragment>
  )
}

AspectTableCore.proptTypes = {
  /**
    Data input for tables
  */
  data: oneOfType([array]).isRequired,
  /**
   Config input for tables
 */
  config: oneOfType([object]).isRequired,
}

const Loading = () => (
  <div className={cssClasses('table__spinner')}>
    <CircularProgress />
  </div>
)

const AspectTable = ({ baseConfig, consts: CONSTS }) => {
  const intl = useIntl()
  const config = baseConfig(intl)
  const { push } = useHistory()
  const { pathname, search } = useLocation()
  const query = useUrlQuery(search)
  const {
    size: urlSize = false,
    page: urlPage = 0,
    sortCol: urlSortCol = null,
    sortDir: urlSortDir = null,
  } = getParamsFromUrl(query, search)
  const [size, setSize] = useState(urlSize || 10)
  const [sortCol, setSortCol] = useState(urlSortCol)
  const [sortDir, setSortDir] = useState(urlSortDir)
  const [page, setPage] = useState(urlPage)
  const [allowReset, setAllowReset] = useState(false)
  const [params, setParams] = useState(
    removeNullFromCollection({ size, sortCol, sortDir, page })
  )

  const {
    error,
    isError,
    isLoading,
    isFetching,
    resolvedData: data = false,
  } = usePaginatedQuery(
    [CONSTS.KEY, { params }],
    async (_queryId, { params }) => {
      return fetchWrapperForQueries({
        endpoint: CONSTS.ENDPOINT,
        params,
      })
    },
    {
      keepPreviousData: true,
    }
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (params) {
      const newUrlParams = new URLSearchParams(params).toString()
      const urlParams = getParamsFromUrl(query, search)
      if (!isEqual(urlParams, params)) {
        push(`${pathname}?${newUrlParams}`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    if (!isEqual(params, { size, sortCol, sortDir, page })) {
      setParams(removeNullFromCollection({ size, sortCol, sortDir, page }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, sortCol, sortDir, page])

  const handleClearParams = () => {
    setAllowReset(!allowReset)
  }

  return isLoading || !data ? (
    <Loading />
  ) : (
    <AspectTableCore
      config={config}
      tableData={data}
      params={params}
      isFetching={isFetching}
      initialState={removeNullFromCollection({
        pageSize: size,
        sortBy: [{ id: sortCol, desc: determineSortDirection(sortDir) }],
        pageIndex: page,
        allowReset,
      })}
      setters={{ handleClearParams, setSize, setSortCol, setSortDir, setPage }}
    />
  )
}

export { AspectTable, AspectTableCore }
