import React, { useState } from 'react'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Button, Checkbox, CircularProgress, Collapse, IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import IconProvider from '../../../../components/IconProvider'
import useCandidateInstruments from '../../../../hooks/device/useCandidateInstruments'
import useTransferInstruments from '../../../../hooks/device/useTransferInstruments'
import AspectTooltip from '../../../../oldComponents/shared/AspectTooltip'
import styles from '../styles.module.css'
import GeneXpertModulesNames from './GeneXpertModulesNames'
import messages from './messages'

const CandidateInstruments = ({ deviceId, disabled = false }) => {
  const { formatMessage } = useIntl()
  const { data = [], isLoading, refetch } = useCandidateInstruments(deviceId)
  const [selectedInstruments, setSelectedInstruments] = useState(new Set())
  const [expanded, setExpanded] = useState(false)

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

  const { mutate: transferInstrumentsMutation } = useTransferInstruments()

  const handleAddToDeviceClick = () => {
    const selectedInstrumentsData = data
      .filter(instrument => {
        const key = `${instrument.deviceId}-${instrument.instrumentSerial}`
        return selectedInstruments.has(key)
      })
      .map(instrument => ({
        deviceId: instrument.deviceId,
        instrumentSerial: instrument.instrumentSerial,
      }))
    transferInstrumentsMutation(
      { sourceInstrumentsData: selectedInstrumentsData, targetDeviceId: deviceId },
      {
        onSuccess: () => {
          refetch()
          toast.success(formatMessage(messages.instrumentsTransferredSuccessfully))
        },
        onError: () => {
          toast.error(formatMessage(messages.instrumentsTransferFailed))
        },
      }
    )
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
    <div
      style={{
        marginTop: '16px',
        paddingTop: '16px',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
        role="button"
        tabIndex={0}
      >
        <IconButton size="small" sx={{ padding: '4px', marginRight: '4px' }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <AspectTooltip
          title={formatMessage(messages.geneXpertInstrumentsTooltip)}
          showHelpIcon={false}
          showPointerCursor={false}
          toolTipContainerClass={styles.inline__tooltip}
          iconClass={styles.deviceSummary__helpIcon}
        >
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--aspect-color-grey-2)',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {formatMessage(messages.otherInstrumentsDetected, { count: data.length })}
            <IconProvider icon="FaExclamationCircle" style={{ marginLeft: '6px' }} />
          </span>
        </AspectTooltip>
      </div>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div style={{ marginTop: '12px', paddingLeft: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            {data.map(instrument => {
              const key = `${instrument.deviceId}-${instrument.instrumentSerial}`
              const selected = isSelected(instrument.deviceId, instrument.instrumentSerial)

              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    paddingLeft: '4px',
                  }}
                >
                  <Checkbox
                    checked={selected}
                    onChange={() => handleSelectOne(instrument.deviceId, instrument.instrumentSerial)}
                    size="small"
                    style={{ padding: '4px' }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px',
                    }}
                  >
                    <span style={{ color: 'var(--aspect-color-grey-2)', fontWeight: 500 }}>
                      {formatMessage(messages.bayNames)}:{' '}
                    </span>
                    <span style={{ color: 'var(--aspect-color-grey-2)', fontWeight: 500 }}>
                      <GeneXpertModulesNames modules={instrument.modules} />
                    </span>
                    <span style={{ color: 'var(--aspect-color-grey-4, #91949d)' }}>
                      · {formatMessage(messages.serial)}: {instrument.instrumentSerial}
                      {instrument.deviceName && ` · ${instrument.deviceName}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToDeviceClick}
              disabled={disabled || selectedInstruments.size === 0}
            >
              {formatMessage(messages.addToThisDevice)}
            </Button>
          </div>
        </div>
      </Collapse>
    </div>
  )
}

CandidateInstruments.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  disabled: PropTypes.bool,
}

CandidateInstruments.defaultProps = {
  disabled: false,
}

export default CandidateInstruments
