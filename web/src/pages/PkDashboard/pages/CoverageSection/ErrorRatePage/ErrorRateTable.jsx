import React, { useCallback, useContext, useMemo, useState } from 'react'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material'
import { makeStyles } from '@mui/styles'
import orderBy from 'lodash/orderBy'
import { addDepth } from '../../../../../utils/utils/table'
import { makeNestedData } from './helpers'

const border = '1px solid rgba(224, 224, 224, 1)'

const SortContext = React.createContext(null)

const useStyles = makeStyles({
  table: {
    borderRight: border,
    borderTop: border,
    '& .MuiTableCell-root': {
      width: 100,
      maxWidth: 100,
      borderLeft: border,
    },
  },
})

const Row = ({ row, isChild, index }) => {
  const { renderRow } = useContext(SortContext)
  const [open, setOpen] = useState(-1)
  const colors = isChild ? ['#dadbdf', '#e6e6e6'] : ['#eef1f8', '#ffffff']
  return (
    <>
      <TableRow sx={{ bgcolor: colors[index % 2] }} onClick={() => setOpen(open === row.id ? -1 : row.id)}>
        <TableCell align="left" style={{ width: '15%', paddingLeft: isChild ? row?.depth * 12.5 : null }}>
          <Box display="flex">
            <Box sx={{ opacity: row.children?.length ? 1 : 0, display: 'flex', alignItems: 'center' }}>
              {open === row.id ? <ExpandLess /> : <ExpandMore />}
            </Box>
            <span>{row.name}</span>
          </Box>
        </TableCell>
        <TableCell align="center">{row.numberOfModules}</TableCell>
        <TableCell align="center">{row.cntMtbResults}</TableCell>
        <TableCell align="center">{row.cntMtbError}</TableCell>
        <TableCell align="center">{row.errorPercent}</TableCell>
        <TableCell align="center">{row.cntMtbInvalid}</TableCell>
        <TableCell align="center">{row.invalidPercent}</TableCell>
        <TableCell align="center">{row.cntMtbNoResult}</TableCell>
        <TableCell align="center">{row.noResultPercent}</TableCell>
      </TableRow>
      {open === row.id ? renderRow(row.children, { isChild: true }) : null}
    </>
  )
}

export const ErrorRateTable = ({ items }) => {
  const [sort, setSort] = useState({ name: 'name', order: 'asc' })
  const rows = useMemo(
    () => addDepth(makeNestedData(items ?? [], ['stateName', 'lgaName', 'siteName', 'name'])),
    [items]
  )

  const renderRow = useCallback(
    (items, props) =>
      orderBy(items, sort.name, sort.order).map((row, index) => (
        <Row key={row.name} row={row} index={index} {...props} />
      )),
    [sort]
  )
  const classes = useStyles()
  const topHeaders = [
    { id: 'name', title: 'Name', colSpan: 1 },
    { id: 'numberOfModules', title: 'Total Modules', colSpan: 1 },
    { id: 'cntMtbResults', title: 'Total Tests', colSpan: 1 },
    { id: 'cntMtbError', title: 'Errors', colSpan: 2 },
    { id: 'cntMtbInvalid', title: 'Invalid', colSpan: 2 },
    { id: 'cntMtbNoResult', title: 'No Result', colSpan: 2 },
  ]
  return (
    <SortContext.Provider value={{ renderRow }}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            {topHeaders.map((h, index) => (
              <TableCell
                key={h.id}
                sx={h.colSpan <= 1 ? { borderBottom: 'unset' } : undefined}
                colSpan={h.colSpan}
                align={index === 0 ? 'left' : 'center'}
              >
                <TableSortLabel
                  active={sort?.name === h.id}
                  direction={sort?.order}
                  onClick={() =>
                    setSort({
                      name: h.id,
                      order: sort?.order === 'asc' ? 'desc' : 'asc',
                    })
                  }
                >
                  {h.title}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell />
            <TableCell />
            <TableCell />
            <TableCell align="center">#</TableCell>
            <TableCell align="center">%</TableCell>
            <TableCell align="center">#</TableCell>
            <TableCell align="center">%</TableCell>
            <TableCell align="center">#</TableCell>
            <TableCell align="center">%</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{renderRow(rows)}</TableBody>
      </Table>
    </SortContext.Provider>
  )
}
