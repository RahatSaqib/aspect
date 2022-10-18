import React, { Fragment, useMemo, useEffect } from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import isNil from 'lodash/isNil'
import { array, number, object, oneOfType, shape } from 'prop-types'
import { useColumnOrder, useExpanded, useFilters, useGroupBy, usePagination, useSortBy, useTable } from 'react-table'
import { bool } from 'yup'
import { buildColumnsFromData, getCurrentColumnIndexAndShift } from './Helpers'
import TableBodyRow from './TableBody/TableBodyRow'
import TableHeaderRow from './TableHeader/TableHeaderRow'
import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import AspectTablePagination from './TablePagination'
import AspectTableReset from './TableReset'

const AspectTableCore = ({
  config,
  tableData,
  isFetching,
  initialState,
  setters,
  manualPagination = true,
  pageCount: controlledPageCount,
  onClickRow,
}) => {
  const { handleClearParams, setSize, setSortCol, setSortDir, setPage } = setters
  const { total = 0, data = [] } = tableData || {}
  const { name, namePlural } = config
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
    state: { pageIndex, pageSize, sortBy, columnOrder, hiddenColumns, groupBy, expanded },
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
  const [{ id: sortColumn = null, desc: isSortDescending = null } = {}] = sortBy

  const handleChangeRowsPerPage = val => {
    setPageSize(typeof val !== 'number' ? total : Number(val))
  }

  const handleChangeColumnOrder = (e, direction, index) => {
    e.stopPropagation()
    setColumnOrder(getCurrentColumnIndexAndShift(visibleColumns, direction, index))
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
    setSize(pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  useEffect(() => {
    setPage(pageIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  useEffect(() => {
    if (initialSortBy) {
      if (isNil(isSortDescending) || isNil(sortColumn)) {
        setSortBy([initialSortBy])
      } else {
        setSortCol(sortColumn)
        setSortDir(isSortDescending ? 'desc' : 'asc')
      }
    } else {
      let sortDir = null
      if (!isNil(isSortDescending)) {
        sortDir = isSortDescending ? 'desc' : 'asc'
      }
      setSortCol(sortColumn)
      setSortDir(sortDir)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortColumn, isSortDescending])

  useEffect(() => {
    if (visibleColumns && !columnOrder.length) {
      setColumnOrder(initialOrder)
    }
  }, [visibleColumns, allowColumnReOrder, columnOrder, initialOrder, setColumnOrder])

  return (
    <Fragment>
      {initialState.allowReset ? <AspectTableReset isFetching={isFetching} action={handleClearParams} /> : null}
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
            const { getRowProps, cells, getToggleRowExpandedProps, isExpanded, subRows } = row
            return (
              <TableRow {...getRowProps()}>
                <TableBodyRow
                  cells={cells}
                  getToggleRowExpandedProps={getToggleRowExpandedProps}
                  isExpanded={isExpanded}
                  subRows={subRows}
                  onClick={onClickRow}
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
        namePlural={namePlural}
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
