import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useQuery } from 'react-query'
import { defineMessages, injectIntl } from 'react-intl'
import { useHistory } from 'react-router'

import AspectDialog from '../../../../components/shared/AspectDialog'
import AutoComplete from '../../../../components/shared/AutoComplete'
import CheckboxField from '../../../../components/shared/CheckboxField'
import fetchWrapperForQueries from '../../../QueryFetch'
import { SITE_ALL } from '../../../QueryFetch/Site'
import { RESULT_TRANSFER } from '../../../QueryFetch/Result'
import { aspectFetch } from '../../../../shared/utils/fetch'
import { errorPleaseTryAgainInAFewMinutes } from '../../../../error/CommonErrorNotifications'
import { SitesAllErrors } from './errors'

const cssClasses = classnames.bind(require('../Detail.css'))

const messages = defineMessages({
  header: {
    id: 'pages.transferResult.header',
    defaultMessage: 'Transfer Result',
  },
  titleSites: {
    id: 'pages.transferResult.titleSites',
    defaultMessage: 'Transfer to Clinic',
  },
  hint: {
    id: 'pages.transferResult.hint',
    defaultMessage: 'Enter clinic name',
  },
  buttonCancel: {
    id: 'pages.transferResult.buttonCancel',
    defaultMessage: 'Cancel',
  },
  buttonTransfer: {
    id: 'pages.transferResult.buttonTransfer',
    defaultMessage: 'Transfer',
  },
  includeAllResults: {
    id: 'pages.transferResult.includeAllResults',
    defaultMessage: 'Include ALL results related to Patient ID',
  },
  processing: {
    id: 'pages.transferResult.processing',
    defaultMessage: 'Processing...',
  },
  note: {
    id: 'pages.transferResult.note',
    defaultMessage: `
      Please notice that above field 'Transfer to Clinic' lists all clinics, even those
      which you may not have access to.
      In a such case - by transferring this result you won't
      be able to edit this result record any more, and your
      action cannot be undone.
    `,
  },
  successOk: {
    id: 'pages.transferResult.successOk',
    defaultMessage: `Ok`,
  },
  successHeader: {
    id: 'pages.transferResult.successHeader',
    defaultMessage: `
      Result Transfer Completed
    `,
  },
  successMessage: {
    id: 'pages.transferResult.successMessage',
    defaultMessage: `
      <p>
        Result for patient <strong>"{{patientId}}"</strong> has been transferred from
        <strong>
          "{{oldSiteName}}"
        </strong>
        to
        <strong>
          "{{newSiteName}}"
        </strong>
      </p>
      <br />
      <p>
        After clicking below button <strong>{{buttonOk}}</strong>
        you will be redirected to the list of results.
      </p>
    `,
  },
})

const ResultTransferModal = ({
  intl: { formatMessage },
  data: { id: resultId, patientId, reportableSiteId, reportableSiteName } = {},
  isOpen,
  onClose,
}) => {
  const [allSites, setAllSites] = useState([])
  const [sourceSite, setSourceSite] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [comment, setComment] = useState('')
  const [includeAllResults, setIncludeAllResults] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transferError, setTransferError] = useState(null)
  const [isSuccessAlert, setSuccessAlert] = useState(false)
  const history = useHistory()

  useQuery(
    [SITE_ALL.KEY],
    async key =>
      fetchWrapperForQueries({
        endpoint: `${SITE_ALL.ENDPOINT}`,
        errors: SitesAllErrors,
      }),
    {
      onSuccess: ({ data }) =>
        setAllSites(
          data
            .filter(({ id }) => +id !== +reportableSiteId)
            .map(({ id, name }) => ({ text: name, value: id }))
        ),
    }
  )

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
  }, [])

  useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen])

  const onRequestClose = () => {
    if (!isProcessing && onClose) {
      onClose()
    }
  }
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

  const renderSuccessMessage = () => {
    const html = formatMessage(messages.successMessage)
      .replace('{{patientId}}', patientId)
      .replace('{{oldSiteName}}', sourceSite.name)
      .replace('{{newSiteName}}', selectedSite && selectedSite.text)
      .replace('{{buttonOk}}', formatMessage(messages.successOk))
    return (
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    )
  }

  return (
    <AspectDialog
      actions={[
        <Button
          color="primary"
          disabled={isProcessing}
          onClick={onRequestClose}
        >
          {formatMessage(messages.buttonCancel)}
        </Button>,
        <Button
          color="primary"
          variant="contained"
          disabled={isProcessing || !selectedSite}
          onClick={onSubmit}
        >
          {formatMessage(messages.buttonTransfer)}
        </Button>,
      ]}
      maxWidth="sm"
      open={isOpen}
      onRequestClose={onRequestClose}
      showCrossIcon
      title={`${formatMessage(messages.header)}: ${patientId}`}
      disableBackdropClick
      disableEscapeKeyDown
    >
      <div>
        <AutoComplete
          classes={{ container: cssClasses('autocomplete-wrapper') }}
          hintText={formatMessage(messages.hint)}
          floatingLabelText={formatMessage(messages.titleSites)}
          floatingLabelFixed
          dataSource={allSites}
          listStyle={{ width: 'auto' }}
          onSelect={selectedSite => setSelectedSite(selectedSite)}
          filter={AutoComplete.caseInsensitiveFilter}
        />
        <TextField
          fullWidth
          multiline
          rowsMax="5"
          placeholder="Enter comment"
          onChange={event => setComment(event.target.value)}
          margin="normal"
          value={comment}
          inputProps={{ maxLength: 1000 }}
        />
      </div>

      <CheckboxField
        checked={includeAllResults}
        label={formatMessage(messages.includeAllResults)}
        onChange={(event, isChecked) => setIncludeAllResults(isChecked)}
      />
      <div className={cssClasses('NoteWrapper')}>
        {formatMessage(messages.note)}
      </div>

      {isProcessing && (
        <div className={cssClasses('processing')}>
          <div className={cssClasses('processing-spinner')}>
            <CircularProgress size="100%" thickness="1" disableShrink />
          </div>
          <div className={cssClasses('processing-label')}>
            {formatMessage(messages.processing)}
          </div>
        </div>
      )}

      {transferError && (
        <div className={cssClasses('ErrorMessage')}>{transferError}</div>
      )}

      {isSuccessAlert && (
        <AspectDialog
          actions={[
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                history.push('/browse/result')
              }}
            >
              {formatMessage(messages.successOk)}
            </Button>,
          ]}
          maxWidth="xs"
          open
          title={formatMessage(messages.successHeader)}
          disableBackdropClick
          disableEscapeKeyDown
        >
          {renderSuccessMessage()}
        </AspectDialog>
      )}
    </AspectDialog>
  )
}

export default injectIntl(ResultTransferModal)
