import React from 'react'
import { Card, CircularProgress, Table, TableBody, TableContainer } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import useDeviceInstruments from '../../../../hooks/device/useDeviceInstruments'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../../oldComponents/shared/tableHead'
import { formatDateTime } from '../../../../utils/utils/dateFormat'
import styles from '../styles.module.css'
import messages from './messages'

const getColumns = formatMessage => [
  {
    key: 'instrumentSerial',
    label: formatMessage(messages.instrumentSerial),
    sortable: false,
  },
  {
    key: 'modules',
    label: formatMessage(messages.bayNames),
    sortable: false,
  },
]

const DeviceInstrumentsTable = ({ deviceId }) => {
  const { formatMessage } = useIntl()
  const { data = [], isLoading } = useDeviceInstruments(deviceId)
  const columns = getColumns(formatMessage)

  return (
    <section className={styles.Section}>
      <Card className={styles.Section}>
        <p data-panel-title>{formatMessage(messages.instrumentListTitle)}</p>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : data.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>{formatMessage(messages.noInstruments)}</p>
        ) : (
          <TableContainer>
            <Table className={styles.ResultDataTable} size="small">
              <DataTableHead columns={columns} />
              <TableBody>
                {data.map(instrument => (
                  <TableRow key={instrument.instrumentSerial}>
                    <TableCell>{instrument.instrumentSerial}</TableCell>
                    <TableCell>
                      {instrument.modules.map((module, idx) => (
                        <span key={module.moduleName}>
                          <span
                            title={
                              module.lastResultDate
                                ? formatMessage(messages.lastResultDateTooltip, {
                                    date: formatDateTime(module.lastResultDate),
                                  })
                                : formatMessage(messages.noResult)
                            }
                            style={{ color: module.lastResultDate ? undefined : '#888' }}
                          >
                            {module.moduleName}
                          </span>
                          {idx < instrument.modules.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </section>
  )
}

DeviceInstrumentsTable.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

export default DeviceInstrumentsTable
