import React, { useState } from 'react'
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
} from '@mui/material'

const InventoryTable = ({ columns, rows, hasDetail, isDetail }) => {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [open, setOpen] = useState(-1)
  const colors = isDetail ? ['#dadbdf', '#e6e6e6'] : ['#eef1f8', '#ffffff']

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    // <Table size={isDetail ? 'small' : undefined}>
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((c, idx) => (
            <TableCell align={idx !== 0 ? 'right' : undefined}>{c.name}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {(rowsPerPage > 0 ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : rows).map((row, i) => (
          <>
            <TableRow
              sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: colors[i % 2] }}
              onClick={() => setOpen(open === row.id ? -1 : row.id)}
            >
              <TableCell scope="row">{row.name}</TableCell>
              <TableCell align="right">{row.quantity}</TableCell>
              <TableCell align="right">{row.lastSixMonths}</TableCell>
              <TableCell align="right">{row.used}</TableCell>
              <TableCell align="right">{row.rate}</TableCell>
              <TableCell align="right">{row.left}</TableCell>
            </TableRow>
            {hasDetail ? (
              <TableRow>
                <TableCell sx={{ p: 0 }} colSpan={7}>
                  <Collapse in={open === row.id} timeout="auto" unmountOnExit>
                    <Box sx={{ ml: 0.5, mr: 0.5, backgroundColor: colors[i % 2] }}>
                      <InventoryTable columns={columns} rows={row.detail} isDetail />
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            ) : null}
          </>
        ))}

        {emptyRows > 0 && (
          <TableRow style={{ height: 44.5 * emptyRows }}>
            <TableCell colSpan={6} />
          </TableRow>
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TablePagination
            rowsPerPageOptions={[10, 20, { label: 'All', value: -1 }]}
            colSpan={6}
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            SelectProps={{ native: true }}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            // ActionsComponent={TablePaginationActions}
          />
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default InventoryTable
