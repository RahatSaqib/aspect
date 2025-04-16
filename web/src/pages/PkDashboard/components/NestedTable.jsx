import React, { useState, Fragment } from 'react'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
  Box,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'

function addDepth(items) {
  const tree = { children: items }
  const stack = [[tree, 0]]
  let n
  while (stack?.length) {
    n = stack.length
    const [node, i] = stack[n - 1]
    if (i < node?.children?.length) {
      stack.push([node.children[i], 0])
      // eslint-disable-next-line no-plusplus
      stack[n - 1][1]++
    } else {
      stack.pop()
      node.depth = n
    }
  }

  return tree?.children
}

function getComparator(order, orderBy) {
  const descendingComparator = (a, b, orderBy) => (b[orderBy] < a[orderBy] ? -1 : b[orderBy] > a[orderBy] ? 1 : 0)

  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

const NestedTable = ({ columns, rows, isDetail, perPage = 10, allowPagination = true, allowCustomOrder = true }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(perPage)
  const [order, setOrder] = useState(allowCustomOrder ? 'asc' : null)
  const [orderBy, setOrderBy] = useState(allowCustomOrder ? columns[0].prop : null)
  const [open, setOpen] = useState(-1)
  const colors = isDetail ? ['#dadbdf', '#e6e6e6'] : ['#eef1f8', '#ffffff']

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0

  const handleChangePage = (event, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (rows && allowCustomOrder) rows = rows.sort(getComparator(order, orderBy))

  if (rows && allowPagination) rows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return rows ? (
    <Table style={{ tableLayout: 'fixed' }}>
      {!isDetail ? (
        <TableHead>
          <TableRow>
            {columns.map((c, idx) =>
              c?.rest?.skip ? null : (
                <TableCell key={c.prop} align={idx !== 0 ? 'right' : undefined} {...c.rest}>
                  {allowCustomOrder ? (
                    <TableSortLabel
                      style={{ width: '100%' }}
                      active={orderBy === c.prop}
                      direction={orderBy === c.prop ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === c.prop && order === 'asc'
                        setOrder(isAsc ? 'desc' : 'asc')
                        setOrderBy(c.prop)
                        setPage(0)
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: idx !== 0 ? 'end' : undefined }}>
                        {c.name}
                        {c.tooltip && <AspectTooltip title={c.tooltip} showHelpIcon />}
                      </Box>
                    </TableSortLabel>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: idx !== 0 ? 'end' : undefined }}>
                      {c.name}
                      {c.tooltip && <AspectTooltip title={c?.tooltip} showHelpIcon />}
                    </Box>
                  )}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
      ) : null}
      <TableBody>
        {rows.map((row, i) => {
          const hasChildren = row?.children?.length > 0 ?? false
          return (
            <Fragment key={i}>
              <TableRow sx={{ backgroundColor: colors[i % 2] }} onClick={() => setOpen(open === i ? -1 : i)}>
                {columns.map((c, i) => (
                  <TableCell
                    width="10%"
                    scope={i === 0 ? 'row' : undefined}
                    style={{ paddingLeft: isDetail ? row?.depth * 20 : null }}
                    key={`${i}_1_${c.prop}`}
                    align={i !== 0 ? 'right' : undefined}
                    {...(c.cellProp?.(row) || {})}
                  >
                    {i === 0 ? (
                      <Box display="flex">
                        <Box sx={{ opacity: hasChildren ? 1 : 0, display: 'flex', alignItems: 'center' }}>
                          {open === i ? <ExpandLess /> : <ExpandMore />}
                        </Box>
                        <span>{row?.[c.prop] ?? 'N/A'}</span>
                      </Box>
                    ) : (
                      row?.[c.prop] ?? 'N/A'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              {hasChildren ? (
                <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                  <TableCell sx={{ p: 0 }} colSpan={columns?.length}>
                    <Collapse in={open === i} timeout="auto" unmountOnExit>
                      <Box sx={{ backgroundColor: colors[i % 2] }}>
                        <NestedTable
                          perPage={rowsPerPage}
                          columns={columns}
                          isDetail
                          rows={row.children}
                          allowCustomOrder={allowCustomOrder}
                          allowPagination={allowPagination}
                        />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}

        {emptyRows > 0 && (
          <TableRow style={{ height: 44.5 * emptyRows }}>
            <TableCell colSpan={columns?.length + 1} />
          </TableRow>
        )}
      </TableBody>
      {rows.length > rowsPerPage && allowPagination ? (
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 20, { label: 'All', value: -1 }]}
              colSpan={6}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  ) : null
}

export default props => {
  const { rows, ...rest } = props
  return <NestedTable rows={addDepth(rows ?? [])} {...rest} />
}
