import React, { useEffect } from 'react'
import { Button, TextField } from '@mui/material'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import { defineMessages, useIntl } from 'react-intl'
import { SiteSelect } from '../../../components'
import AspectDialog from '../../../components/shared/AspectDialog'
import styles from './DeviceApiKeyList.module.css'

const messages = defineMessages({
  cancel: {
    id: 'pages.DeviceApiKeyList.cancel',
    defaultMessage: 'Cancel',
  },
  generate: {
    id: 'pages.DeviceApiKeyList.generate',
    defaultMessage: 'Generate',
  },
  generatorDialogTitle: {
    id: 'pages.DeviceApiKeyList.generatorDialogTitle',
    defaultMessage: 'Device API Keys Generator',
  },
  count: {
    id: 'pages.DeviceApiKeyList.count',
    defaultMessage: 'Count (1-100)',
  },
  siteId: {
    id: 'pages.DeviceApiKeyList.siteId',
    defaultMessage: 'Site',
  },
})

const INITIAL_VALUES = { count: 1 }

const clampCount = value => Math.min(Math.max(1, Number(value) || 1), 100)

const DeviceApiKeyGeneratorDialogForm = ({ isDialogOpen, onCancel, onSubmit }) => {
  const { formatMessage } = useIntl()

  const { values, setFieldValue, handleSubmit, resetForm, isSubmitting } = useFormik({
    initialValues: INITIAL_VALUES,
    onSubmit: formValues => onSubmit(formValues),
  })

  // reset on open rather than on close, so the fields never blank out while the dialog is still visible
  useEffect(() => {
    if (isDialogOpen) resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen])

  const actions = [
    <Button key="cancel" type="button" color="secondary" onClick={onCancel}>
      {formatMessage(messages.cancel)}
    </Button>,
    <Button key="generate" disabled={isSubmitting} onClick={handleSubmit} type="button" color="primary">
      {formatMessage(messages.generate)}
    </Button>,
  ]

  return (
    <AspectDialog
      title={formatMessage(messages.generatorDialogTitle)}
      actions={actions}
      open={isDialogOpen}
      onRequestClose={onCancel}
      autoScrollBodyContent
    >
      <form className={styles.GeneratorForm} onSubmit={handleSubmit}>
        <TextField
          fullWidth
          name="count"
          type="number"
          label={formatMessage(messages.count)}
          InputLabelProps={{
            shrink: undefined,
          }}
          value={values.count}
          onChange={event => setFieldValue('count', clampCount(event.target.value))}
        />
        <SiteSelect
          id="siteId"
          name="siteId"
          label={formatMessage(messages.siteId)}
          value={values.siteId || ''}
          onChange={event => setFieldValue('siteId', event.target.value)}
        />
      </form>
    </AspectDialog>
  )
}

DeviceApiKeyGeneratorDialogForm.propTypes = {
  isDialogOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default DeviceApiKeyGeneratorDialogForm
