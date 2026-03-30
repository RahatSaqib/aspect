import React from 'react'
import WarningIcon from '@mui/icons-material/Warning'
import { Card, CircularProgress, Table, TableBody, TableContainer, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { CANDIDATE_INSTRUMENTS_KEY, DEVICE_INSTRUMENTS_KEY } from '../../../../hooks/device/deviceKeys.js'
import useDeviceInstruments from '../../../../hooks/device/useDeviceInstruments'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../../oldComponents/shared/tableHead'
import styles from '../styles.module.css'
import CandidateInstruments from './CandidateInstruments'
import GeneXpertModulesNames from './GeneXpertModulesNames'
import InstrumentContextualMenu from './InstrumentContextualMenu'
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
  {
    key: 'actions',
    label: '',
  },
]

const DeviceInstrumentsTable = ({ deviceId, disabled = false }) => {
  const { formatMessage } = useIntl()
  const queryClient = useQueryClient()
  const { data = [], isLoading, refetch } = useDeviceInstruments(deviceId)
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
                  <TableRow key={instrument.instrumentId}>
                    <TableCell>{instrument.instrumentSerial}</TableCell>
                    <TableCell>
                      <GeneXpertModulesNames modules={instrument.modules} />
                    </TableCell>
                    <TableCell align="right">
                      {instrument.active ? (
                        <InstrumentContextualMenu
                          deviceId={deviceId}
                          instrument={instrument}
                          onMoveToExisting={async () => {
                            // After moving instrument, refresh the instrument list
                            await refetch()
                            queryClient.invalidateQueries(['device-instruments', deviceId])
                          }}
                          onMoveToNew={async () => {
                            await refetch()
                            // Invalidate device instruments for current device
                            queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY, deviceId])
                            // Invalidate candidate instruments for current device
                            queryClient.invalidateQueries([CANDIDATE_INSTRUMENTS_KEY, deviceId])
                          }}
                        />
                      ) : (
                        <Tooltip title={formatMessage(messages.duplicatedInstrumentTooltip)}>
                          <WarningIcon className={styles.InactiveInstrumentWarningIcon} color="warning" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <CandidateInstruments deviceId={deviceId} disabled={disabled} />
      </Card>
    </section>
  )
}

DeviceInstrumentsTable.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  disabled: PropTypes.bool,
}

DeviceInstrumentsTable.defaultProps = {
  disabled: false,
}

export default DeviceInstrumentsTable
