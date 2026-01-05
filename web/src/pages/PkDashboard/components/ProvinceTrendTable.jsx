import * as React from 'react'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import messages from '../PkDashboard.Messages'

const ProvinceTrendTable = props => {
  const { rows, title, resultType } = props
  const { formatMessage } = useIntl()

  const yearTableCell = resultType
    ? formatMessage(messages.customPerYear, { resultType })
    : formatMessage(messages.testPerYear)

  const monthTableCell = resultType
    ? formatMessage(messages.customPerMonth, { resultType })
    : formatMessage(messages.testPerMonth)

  const todayTableCell = resultType
    ? formatMessage(messages.customToday, { resultType })
    : formatMessage(messages.testToday)

  const user = useAuthState()
  const stateName = getCustomMessage(formatMessage, messages, 'state', user, { entity: 'state' })

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
            <TableCell>{stateName}</TableCell>
            <TableCell align="right">{yearTableCell}</TableCell>
            <TableCell align="right">{monthTableCell}</TableCell>
            <TableCell align="right">{todayTableCell}</TableCell>
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
