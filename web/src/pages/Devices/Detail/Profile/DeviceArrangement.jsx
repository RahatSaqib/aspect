import React, { useEffect, useState } from 'react'
import { Card, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Summary from '../../../../oldComponents/Summary'
import { aspectFetch } from '../../../../utils/utils/fetch'
import styles from '../styles.module.css'

const DeviceArrangement = ({ deviceId }) => {
  const { formatMessage, formatDate } = useIntl()
  const [instrumentData, setInstrumentData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeviceSetup = async () => {
      try {
        const result = await aspectFetch(`/device/${deviceId}/arrangement`)
        if (result.ok) {
          setInstrumentData(result.data.instruments)
        }
      } catch (error) {
        console.error('Error fetching device setup:', error)
      } finally {
        setLoading(false)
      }
    }

    if (deviceId) {
      fetchDeviceSetup()
    }
  }, [deviceId])

  const messages = {
    instrumentListTitle: { id: 'device.arrangement.title', defaultMessage: 'Device Arrangement' },
    instrumentSerial: { id: 'device.instrumentList.instrumentSerial', defaultMessage: 'Instrument Serial' },
    bayNames: { id: 'device.instrumentList.bayNames', defaultMessage: 'Bay Names' },
    startedOn: { id: 'device.instrumentList.startedOn', defaultMessage: 'Started On' },
    lastSeenOn: { id: 'device.instrumentList.lastSeenOn', defaultMessage: 'Last Seen On' },
    noInstruments: { id: 'device.instrumentList.noInstruments', defaultMessage: 'No instruments configured' },
  }

  return (
    <section className={styles.Section}>
      <Card className={styles.Section}>
        <p data-panel-title>{formatMessage(messages.instrumentListTitle)}</p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        ) : instrumentData.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>{formatMessage(messages.noInstruments)}</p>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Summary title={formatMessage(messages.instrumentSerial)} />
                  </TableCell>
                  <TableCell>
                    <Summary title={formatMessage(messages.bayNames)} />
                  </TableCell>
                  <TableCell>
                    <Summary title={formatMessage(messages.startedOn)} />
                  </TableCell>
                  <TableCell>
                    <Summary title={formatMessage(messages.lastSeenOn)} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instrumentData.map(instrument => {
                  const bayNames = instrument.modules
                    .map(module => module.moduleName)
                    .filter(Boolean)
                    .join(', ')
                  const startedOn =
                    instrument.modules.length > 0
                      ? Math.min(...instrument.modules.map(m => new Date(m.startedOn)))
                      : null
                  const lastSeenOn =
                    instrument.modules.length > 0
                      ? Math.max(...instrument.modules.map(m => new Date(m.lastSeenOn)))
                      : null

                  return (
                    <TableRow key={instrument.instrumentSerial}>
                      <TableCell>{instrument.instrumentSerial}</TableCell>
                      <TableCell>{bayNames || 'No modules'}</TableCell>
                      <TableCell>{startedOn ? formatDate(startedOn) : 'N/A'}</TableCell>
                      <TableCell>{lastSeenOn ? formatDate(lastSeenOn) : 'N/A'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </section>
  )
}

DeviceArrangement.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

export default DeviceArrangement
