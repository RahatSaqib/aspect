import React, { Fragment, useMemo, useEffect } from 'react'
import { array, number, object, oneOfType, shape } from 'prop-types'
import isEqual from 'lodash/isEqual'

import {
  useColumnOrder,
  useExpanded,
  useFilters,
  useGroupBy,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import { bool } from 'yup'
import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import TableHeaderRow from './TableHeader/TableHeaderRow'
import TableBodyRow from './TableBody/TableBodyRow'

import AspectTablePagination from './TablePagination'
import AspectTableReset from './TableReset'

import { buildColumnsFromData, getCurrentColumnIndexAndShift } from './Helpers'

const AspectTableCore = ({
  config,
  tableData,
  isFetching,
  initialState,
  setters,
  manualPagination = true,
  pageCount: controlledPageCount,
}) => {
  const { handleClearParams, setSize, setSortCol, setSortDir, setPage } =
    setters
  const { total = 0, data = [] } = tableData || {}
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
    {
      columns,
      data,
      initialState,
      manualPagination,
      pageCount: manualPagination ? controlledPageCount : pageCount,
    },
    useColumnOrder,
    useFilters,
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
                    <ContextualMenu item={row.original} />
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

AspectTableCore.defaultProps = {
  isFetching: false,
  initialState: {},
}

AspectTableCore.proptTypes = {
  /**
   Config input for tables
 */
  config: oneOfType([object]).isRequired,
  /**
    Data input for tables
  */
  tableData: oneOfType([
    array, // TODO: remove this line and set `tableData` only with `shape`
    shape({
      total: number.isRequired,
      data: oneOfType([array]).isRequired,
    }),
  ]).isRequired,
  /**
   Data input for tables
 */

  isFetching: bool,
  /**
  Data input for tables
*/
  initialState: oneOfType([object]),
  /**
  Data input for tables
*/
  setters: oneOfType([object]).isRequired,
}

export default AspectTableCore
