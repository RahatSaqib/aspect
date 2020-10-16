import React, { Fragment, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTable, useSortBy, usePagination } from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import TableColumnHeader from './TableColumnHeader'
import AspectTablePagination from './TablePagination'
import { buildColumnsFromData } from './Helpers'

const AspectTable = ({ tableData: data, config }) => {
  const { name } = config
  const { columns, initialSortBy } = useMemo(
    () => buildColumnsFromData(config),
    [config]
  )

  const table = useTable({ columns, data }, useSortBy, usePagination)
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
    setPageSize,
    setSortBy,
    state: { pageIndex, pageSize, sortBy },
  } = table

  function handleChangeRowsPerPage(val) {
    setPageSize(typeof val !== 'number' ? data.length : Number(val))
  }

  useEffect(() => {
    if (!sortBy.length && initialSortBy) {
      setSortBy([initialSortBy])
    }
  }, [sortBy, setSortBy, initialSortBy])

  return data ? (
    <Fragment>
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map(({ headers, getHeaderGroupProps }) => (
            <TableRow {...getHeaderGroupProps()}>
              {headers.map(
                ({
                  getHeaderProps,
                  getSortByToggleProps,
                  isSorted,
                  isSortedDesc,
                  render,
                }) => {
                  return (
                    <TableCell {...getHeaderProps(getSortByToggleProps())}>
                      <TableColumnHeader
                        render={render('Header')}
                        isSorted={isSorted}
                        isSortedDesc={isSortedDesc}
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
