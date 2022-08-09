import React, { useCallback, useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import { defineMessages, injectIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import AspectDialog from '../../../../components/shared/AspectDialog'
import CheckboxField from '../../../../components/shared/CheckboxField'
import { RESULT_TRANSFER } from '../../../QueryFetch/Result'
import { aspectFetch } from '../../../../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../../../../error/CommonErrorNotifications'
import messages from '../messages'
import SiteAutoCompleteField from '../../../SiteAutocompleteField'

import styles from '../Detail.css'

const cssClasses = classnames.bind(styles)

const ResultTransferModal = ({
  intl: { formatMessage },
  data: { id: resultId, patientId, reportableSiteId, reportableSiteName } = {},
  isOpen,
  onClose,
}) => {
  const [sourceSite, setSourceSite] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [comment, setComment] = useState('')
  const [includeAllResults, setIncludeAllResults] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transferError, setTransferError] = useState(null)
  const [isSuccessAlert, setSuccessAlert] = useState(false)
  const navigate = useNavigate()

  const reset = () => {
    setSelectedSite(null)
    setComment('')
    setIncludeAllResults(true)
    setIsProcessing(false)
    setTransferError(null)
  }

  useEffect(() => {
    setSourceSite({
      name: reportableSiteName,
      id: reportableSiteId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen])

  const onRequestClose = useCallback(() => {
    if (!isProcessing && onClose) {
      onClose()
    }
  }, [isProcessing, onClose])

  const onSubmit = () => {
    setIsProcessing(true)

    return aspectFetch(`${RESULT_TRANSFER.ENDPOINT}/${resultId}`, {
      method: 'POST',
      body: JSON.stringify({
        siteId: selectedSite.value,
        timestamp: new Date().getTime(),
        comment,
        includeAllResults,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.transferResult.POST.default.title',
              defaultMessage: 'Transfer Result Error',
            },
          })
        ),
      },
    })
      .then(() => {
        setIsProcessing(false)
        setSuccessAlert(true)
      })
      .catch(err => {
        setIsProcessing(false)
        setTransferError(err.message)
      })
  }

  const renderSpinner = useCallback(
    () => (
      <div className={cssClasses('processing')}>
        <div className={cssClasses('processing-spinner')}>
          <CircularProgress size="100%" thickness={1} disableShrink />
        </div>
        <div className={cssClasses('processing-label')}>{formatMessage(messages.processing)}</div>
      </div>
    ),
    [formatMessage]
  )

  const renderSuccessAlert = useCallback(() => {
    return (
      <AspectDialog
        actions={[
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              navigate('/browse/result')
            }}
          >
            {formatMessage(messages.successOk)}
          </Button>,
        ]}
        maxWidth="xs"
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            onRequestClose()
          }
        }}
        open
        title={formatMessage(messages.successHeader)}
        disableEscapeKeyDown
      >
        <div>
          <p>
            {formatMessage(messages.successMessagePatient, {
              patientId: <strong>{patientId}</strong>,
              oldSiteName: <strong>{sourceSite?.name}</strong>,
              newSiteName: <strong>{selectedSite?.text}</strong>,
            })}
          </p>
          <br />
          <p>{formatMessage(messages.successMessageButton)}</p>
        </div>
      </AspectDialog>
    )
  }, [formatMessage, patientId, sourceSite?.name, selectedSite?.text, navigate, onRequestClose])

  return (
    <AspectDialog
      actions={[
        <Button color="primary" disabled={isProcessing} onClick={onRequestClose}>
          {formatMessage(messages.buttonCancel)}
        </Button>,
        <Button color="primary" variant="contained" disabled={isProcessing || !selectedSite} onClick={onSubmit}>
          {formatMessage(messages.buttonTransfer)}
        </Button>,
      ]}
      maxWidth="sm"
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onRequestClose()
        }
      }}
      open={isOpen}
      onRequestClose={onRequestClose}
      showCrossIcon
      title={`${formatMessage(messages.header)}${patientId ? `: ${patientId}` : ''}`}
      disableEscapeKeyDown
    >
      <div>
        <SiteAutoCompleteField
          name="siteName"
          value={selectedSite}
          onChange={(_, value) => setSelectedSite(value)}
          floatingLabelFixed
          hintText={formatMessage(messages.hint)}
          floatingLabelText={formatMessage(messages.titleSites)}
          width="100%"
        />
        <TextField
          fullWidth
          multiline
          maxRows="5"
          placeholder={formatMessage(messages.enterComment)}
          onChange={event => setComment(event.target.value)}
          margin="normal"
          value={comment}
          inputProps={{ maxLength: 1000 }}
        />
      </div>

      <div style={{ marginTop: 20, marginBottom: 10 }}>
        <CheckboxField
          checked={includeAllResults}
          label={formatMessage(messages.includeAllResults)}
          onChange={event => setIncludeAllResults(event.target.checked)}
        />
      </div>
      <div className={cssClasses('NoteWrapper')}>{formatMessage(messages.note)}</div>

      {isProcessing && renderSpinner()}

      {transferError && <div className={cssClasses('ErrorMessage')}>{transferError}</div>}

      {isSuccessAlert && renderSuccessAlert()}
    </AspectDialog>
  )
}

export default injectIntl(ResultTransferModal)
