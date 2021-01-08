import React, { Fragment, useMemo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router-dom'

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

import TableHiddenColumns from './TableHeader/TableHiddenColumns'
import TableHeaderRow from './TableHeader/TableHeaderRow'
import TableBodyRow from './TableBody/TableBodyRow'

import AspectTablePagination from './TablePagination'
import {
  buildColumnsFromData,
  getCurrentColumnIndexAndShift,
  shapeTableParamsForApi,
} from './Helpers'

const AspectTable = ({ config, tableData, initialParams }) => {
  const { push } = useHistory()
  const { pathname } = useLocation()
  const [params, setParams] = useState(initialParams)
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
    { columns, data },
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
    if (!sortBy.length && initialSortBy) {
      setSortBy([initialSortBy])
    }
  }, [sortBy, setSortBy, initialSortBy])

  useEffect(() => {
    if (visibleColumns && allowColumnReOrder && !columnOrder.length) {
      setColumnOrder(initialOrder)
    }
  }, [
    visibleColumns,
    allowColumnReOrder,
    columnOrder,
    initialOrder,
    setColumnOrder,
  ])

  React.useMemo(() => {
    async function buildAndSetParams() {
      const { page = 0, size, sortCol, sortDir } = await shapeTableParamsForApi(
        {
          pageIndex,
          pageSize,
          sortBy,
          initialOrder,
        }
      )
      const newUrl = new URLSearchParams({
        page,
        size,
        sortCol,
        sortDir,
      }).toString()
      push(`${pathname}?${newUrl}`)
      setParams({
        page,
        size,
        sortCol,
        sortDir,
      })
    }
    if (data && data.length) {
      buildAndSetParams()
    }
  }, [data, pageIndex, pageSize, sortBy])

  return (
    <Fragment>
      {hiddenColumns && hiddenColumns.length ? (
        <TableHiddenColumns
          columns={columns}
          hiddenColumns={hiddenColumns}
          handleHideColumnToggle={handleHideColumnToggle}
        />
      ) : null}
      <Table {...getTableProps()} style={{ tableLayout: 'auto' }}>
        <TableHead>
          {headerGroups.map(({ headers, getHeaderGroupProps }) => (
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

AspectTable.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default AspectTable
