import React, { useState } from 'react'
import { Button, Checkbox, CircularProgress, Table, TableBody, TableContainer, TableHead } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import useCandidateInstruments from '../../../../hooks/device/useCandidateInstruments'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../../oldComponents/shared/tableBody'
import { formatDateTime } from '../../../../utils/utils/dateFormat'
import styles from '../styles.module.css'
import messages from './messages'

const getColumns = formatMessage => [
  {
    key: 'select',
    label: '',
    sortable: false,
  },
  {
    key: 'deviceName',
    label: formatMessage(messages.deviceName),
    sortable: false,
  },
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

const CandidateInstruments = ({ deviceId, disabled = false, onJoinDevices }) => {
  const { formatMessage } = useIntl()
  const { data = [], isLoading } = useCandidateInstruments(deviceId)
  const [selectedInstruments, setSelectedInstruments] = useState(new Set())
  const columns = getColumns(formatMessage)

  const handleSelectAll = event => {
    if (event.target.checked) {
      const allIds = new Set(data.map(instrument => `${instrument.deviceId}-${instrument.instrumentSerial}`))
      setSelectedInstruments(allIds)
    } else {
      setSelectedInstruments(new Set())
    }
  }

  const handleSelectOne = (deviceId, instrumentSerial) => {
    const key = `${deviceId}-${instrumentSerial}`
    const newSelected = new Set(selectedInstruments)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedInstruments(newSelected)
  }

  const isSelected = (deviceId, instrumentSerial) => {
    return selectedInstruments.has(`${deviceId}-${instrumentSerial}`)
  }

  const isAllSelected = data.length > 0 && selectedInstruments.size === data.length

  const handleJoinDevicesClick = () => {
    if (onJoinDevices) {
      const selected = Array.from(selectedInstruments).map(key => {
        const [deviceId, instrumentSerial] = key.split('-')
        return { deviceId: parseInt(deviceId), instrumentSerial }
      })
      onJoinDevices(selected)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
      </div>
    )
  }

  if (data.length === 0) {
    return null
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          marginTop: '16px',
          paddingTop: '16px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--aspect-color-grey-4, #91949d)' }}>
          {formatMessage(messages.joinDevicesMessage)}
        </p>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleJoinDevicesClick}
          disabled={disabled || selectedInstruments.size === 0}
          sx={{ minWidth: 'auto', padding: '4px 16px' }}
        >
          {formatMessage(messages.joinDevicesButton)}
        </Button>
      </div>
      <div style={{ marginTop: '16px', paddingTop: '16px' }}>
        <TableContainer>
          <Table className={styles.ResultDataTable} size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedInstruments.size > 0 && selectedInstruments.size < data.length}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                {columns
                  .filter(col => col.key !== 'select')
                  .map(col => (
                    <TableCell key={col.key}>{col.label}</TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((instrument, index) => {
                const key = `${instrument.deviceId}-${instrument.instrumentSerial}`
                const selected = isSelected(instrument.deviceId, instrument.instrumentSerial)
                return (
                  <TableRow key={key} selected={selected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected}
                        onChange={() => handleSelectOne(instrument.deviceId, instrument.instrumentSerial)}
                      />
                    </TableCell>
                    <TableCell>{instrument.deviceName}</TableCell>
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
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  )
}

CandidateInstruments.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  disabled: PropTypes.bool,
  onJoinDevices: PropTypes.func,
}

CandidateInstruments.defaultProps = {
  disabled: false,
}

export default CandidateInstruments
