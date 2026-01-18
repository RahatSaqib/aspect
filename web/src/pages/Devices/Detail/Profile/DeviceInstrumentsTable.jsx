import React from 'react'
import { Card, CircularProgress, Table, TableBody, TableContainer } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
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
                  <TableRow key={instrument.instrumentSerial}>
                    <TableCell>{instrument.instrumentSerial}</TableCell>
                    <TableCell>
                      <GeneXpertModulesNames modules={instrument.modules} />
                    </TableCell>
                    <TableCell align="right">
                      <InstrumentContextualMenu
                        instrument={instrument}
                        onMoveToExisting={async inst => {
                          // TODO: Implement move to existing device logic
                          // eslint-disable-next-line no-alert
                          alert(`Move instrument ${inst.instrumentSerial} to an existing device`)
                          // After moving instrument, refresh the instrument list
                          await refetch()
                          queryClient.invalidateQueries(['device-instruments', deviceId])
                        }}
                        onMoveToNew={async () => {
                          await refetch()
                          queryClient.invalidateQueries(['device-instruments', deviceId])
                        }}
                      />
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
