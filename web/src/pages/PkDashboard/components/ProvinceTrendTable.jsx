import * as React from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../PkDashboard.Messages'

const ProvinceTrendTable = props => {
  const { rows, title } = props
  const { formatMessage } = useI18n()

  return (
    <Box>
      {title ? (
        <Typography sx={{ m: '10px' }} variant="h6" color="primary" component="div">
          {title}
        </Typography>
      ) : null}
      <Table aria-label="simple-table">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage(messages.state_PK)}</TableCell>
            <TableCell align="right">{formatMessage(messages.testPerYear)}</TableCell>
            <TableCell align="right">{`${formatMessage(messages.testPerMonth)} ${formatMessage(
              messages.currentYear
            )}`}</TableCell>
            <TableCell align="right">{formatMessage(messages.testPerDay)}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.province} sx={{ backgroundColor: index % 2 ? '#fff' : '#eef1f8' }}>
              <TableCell component="th" scope="row">
                {row.province}
              </TableCell>
              <TableCell align="right">{row.perYear}</TableCell>
              <TableCell align="right">{row.monthlyAverage}</TableCell>
              <TableCell align="right">{row.perDay}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default ProvinceTrendTable
