import React, { Fragment, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTable, useSortBy, usePagination, useColumnOrder } from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import TableColumnHeader from './TableColumnHeader'
import TableColumnOrderButtons from './TableColumnOrderButtons'

import AspectTablePagination from './TablePagination'
import { buildColumnsFromData, getCurrentColumnIndexAndShift } from './Helpers'

const AspectTable = ({ tableData: data, config }) => {
  const { name } = config
  const {
    columns,
    initialSortBy,
    columnOrder: { allow: allowColumnReOrder, initialOrder } = false,
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
    visibleColumns,
    state: { pageIndex, pageSize, sortBy, columnOrder },
  } = useTable({ columns, data }, useSortBy, usePagination, useColumnOrder)

  const handleChangeRowsPerPage = val => {
    setPageSize(typeof val !== 'number' ? data.length : Number(val))
  }

  const handleChangeColumnOrder = (e, direction, id) => {
    e.stopPropagation()
    const newOrder = getCurrentColumnIndexAndShift(columnOrder, id, direction)
    setColumnOrder(newOrder)
  }

  useEffect(() => {
    if (!sortBy.length && initialSortBy) {
      setSortBy([initialSortBy])
    }
  }, [sortBy, setSortBy, initialSortBy])

  useEffect(() => {
    if (visibleColumns && allowColumnReOrder) {
      setColumnOrder(initialOrder)
    }
  }, [visibleColumns, allowColumnReOrder, initialOrder, setColumnOrder])

  return data ? (
    <Fragment>
      <Table {...getTableProps()} style={{ tableLayout: 'auto' }}>
        <TableHead>
          {headerGroups.map(({ headers, getHeaderGroupProps }) => (
            <TableRow {...getHeaderGroupProps()}>
              {headers.map(
                (
                  {
                    canSort,
                    getHeaderProps,
                    getSortByToggleProps,
                    isSorted,
                    isSortedDesc,
                    render,
                    width,
                  },
                  index
                ) => {
                  return (
                    <TableCell
                      {...getHeaderProps(getSortByToggleProps())}
                      style={{ width: `${width}%` }}
                    >
                      <TableColumnHeader
                        width={width}
                        render={render('Header')}
                        canSort={canSort}
                        isSorted={isSorted}
                        isSortedDesc={isSortedDesc}
                        headerOrderComponent={() =>
                          allowColumnReOrder ? (
                            <TableColumnOrderButtons
                              headerIndex={index}
                              headersLength={headers.length}
                              handleChangeColumnOrder={handleChangeColumnOrder}
                            />
                          ) : null
                        }
                      />
                    </TableCell>
                  )
                }
              )}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {page.map(row => {
            prepareRow(row)
            const { getRowProps, cells } = row
            return (
              <TableRow {...getRowProps()}>
                {cells.map(({ getCellProps, render }) => {
                  return (
                    <TableCell {...getCellProps()}>{render('Cell')}</TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <AspectTablePagination
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={data.length}
        gotoPage={gotoPage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        nextPage={nextPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        previousPage={previousPage}
        page={page}
        name={name}
      />
    </Fragment>
  ) : null
}

AspectTable.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default AspectTable
