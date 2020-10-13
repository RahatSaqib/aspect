import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useTable, useSortBy } from 'react-table'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import TableColumnHeader from './TableColumnHeader'
import { buildColumnsFromData } from './Helpers'

function AspectTable({ tableData: data, config }) {
  const columns = useMemo(() => buildColumnsFromData(config), [config])
  const { getTableProps, headerGroups, rows, prepareRow } = useTable(
    { columns, data },
    useSortBy
  )

  return (
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
        {rows.map(row => {
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
  )
}

AspectTable.proptTypes = {
  data: PropTypes.oneOf([PropTypes.array]).isRequired,
  config: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default AspectTable
