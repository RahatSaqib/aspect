import React, { useState } from 'react'
import { Button, Checkbox, Card, FormControlLabel, TextField, Stack } from '@mui/material'
import { Formik, Form } from 'formik'
import get from 'lodash/get'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  ImplementingPartnerSelect,
  SiteSelect,
  CepheidInstrumentModelSelect,
  CepheidSoftwareTypeSelect,
  TagInput,
} from '../../../../components'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
import styles from '../styles.module.css'
import messages from './messages'
import { getValidationSchema } from './validation'

const DeviceDetailEdit = ({ device, deviceTags, editable }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useIntl()

  const { mutate: updateDevice } = useUpdateDevice(device.id)
  const { mutate: updateDeviceTags } = useUpdateTagByTypeAndId('device', device.id)
  const [submitting, setSubmitting] = useState(false)

  // Create validation schema using imported function
  const validationSchema = getValidationSchema(intl.formatMessage)

  // Create initial values for Formik
  const initialValues = {
    name: device.name,
    shortName: device.shortName,
    siteId: device.siteId,
    implementingPartnerId: device.implementingPartnerId,
    dailyTestCapacity: device.dailyTestCapacity,
    moduleBayCapacity: device.moduleBayCapacity,
    gx6cModulesCount: device.gx6cModulesCount,
    gx10cModulesCount: device.gx10cModulesCount,
    stickerInstrumentSerial: device.stickerInstrumentSerial,
    instrumentModel: device.instrumentModel,
    softwareType: device.softwareType,
    isDaisyChained: device.isDaisyChained || false, // Keep default for boolean
    notes: device.notes,
    tags: deviceTags || [], // Keep default for array operations
  }

  const onError = () => {
    setSubmitting(false)
    toast.error(intl.formatMessage(messages.deviceUpdateError))
  }

  const handleSubmit = async values => {
    setSubmitting(true)

    // Convert empty strings to null for numeric fields
    const deviceData = {
      ...values,
      dailyTestCapacity: values.dailyTestCapacity === '' ? null : values.dailyTestCapacity,
      gx6cModulesCount: values.gx6cModulesCount === '' ? null : values.gx6cModulesCount,
      gx10cModulesCount: values.gx10cModulesCount === '' ? null : values.gx10cModulesCount,
    }

    updateDeviceTags(values.tags.map(deviceTag => deviceTag.title).join(','), {
      onError,
      onSuccess: () => {
        updateDevice(deviceData, {
          onError,
          onSuccess: () => {
            toast.success(intl.formatMessage(messages.deviceUpdated))
            navigate(`/browse/device/list/${device.id}${location.search}`)
          },
        })
      },
    })
  }

  return (
    <div>
      <Helmet title={device.name} />
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <Card className={styles.Section__Content}>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
            validateOnMount
            validateOnChange
          >
            {({ values, errors, setFieldValue, resetForm, dirty, isValid }) => (
              <Form>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                  label={intl.formatMessage(messages.name)}
                  value={values.name}
                  onChange={e => setFieldValue('name', e.target.value)}
                />
                <TextField
                  fullWidth
                  id="shortName"
                  name="shortName"
                  error={Boolean(errors.shortName)}
                  helperText={errors.shortName}
                  required
                  label={intl.formatMessage(messages.shortName)}
                  value={values.shortName}
                  onChange={e => setFieldValue('shortName', e.target.value)}
                />
                <SiteSelect
                  id="siteId"
                  name="siteId"
                  label={intl.formatMessage(messages.location)}
                  value={values.siteId || ''}
                  onChange={e => setFieldValue('siteId', e.target.value)}
                  disabled={!editable}
                />

                <ImplementingPartnerSelect
                  valueBy="value"
                  label={intl.formatMessage(messages.partner)}
                  value={values.implementingPartnerId ?? null}
                  onChange={implementingPartnerId => setFieldValue('implementingPartnerId', implementingPartnerId)}
                />
                <TextField
                  label={intl.formatMessage(messages.dailyTestCapacity)}
                  type="number"
                  name="dailyTestCapacity"
                  error={Boolean(errors.dailyTestCapacity)}
                  helperText={errors.dailyTestCapacity}
                  value={values.dailyTestCapacity}
                  onChange={e => setFieldValue('dailyTestCapacity', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label={intl.formatMessage(messages.moduleBayCapacity)}
                  type="number"
                  name="moduleBayCapacity"
                  error={Boolean(errors.moduleBayCapacity)}
                  helperText={errors.moduleBayCapacity}
                  value={values.moduleBayCapacity}
                  onChange={e => setFieldValue('moduleBayCapacity', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                {get(device, 'deviceType.externalId') === CONSTS.GENEXPERT_EXTERNAL_ID ? (
                  <>
                    <TextField
                      label={intl.formatMessage(messages.gx6cModulesCount)}
                      type="number"
                      name="gx6cModulesCount"
                      error={Boolean(errors.gx6cModulesCount)}
                      helperText={errors.gx6cModulesCount}
                      value={values.gx6cModulesCount ?? 0}
                      onChange={e => setFieldValue('gx6cModulesCount', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      label={intl.formatMessage(messages.gx10cModulesCount)}
                      type="number"
                      name="gx10cModulesCount"
                      error={Boolean(errors.gx10cModulesCount)}
                      helperText={errors.gx10cModulesCount}
                      value={values.gx10cModulesCount ?? 0}
                      onChange={e => setFieldValue('gx10cModulesCount', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      fullWidth
                      id="stickerInstrumentSerial"
                      name="stickerInstrumentSerial"
                      label={intl.formatMessage(messages.stickerInstrumentSerial)}
                      value={values.stickerInstrumentSerial}
                      onChange={e => setFieldValue('stickerInstrumentSerial', e.target.value)}
                    />

                    <CepheidInstrumentModelSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.instrumentModel)}
                      value={values.instrumentModel}
                      onChange={instrumentModel => setFieldValue('instrumentModel', instrumentModel)}
                    />

                    <CepheidSoftwareTypeSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.softwareType)}
                      value={values.softwareType}
                      onChange={softwareType => setFieldValue('softwareType', softwareType)}
                    />

                    <FormControlLabel
                      sx={{ mb: '20px' }}
                      control={
                        <Checkbox
                          type="checkbox"
                          name="isDaisyChained"
                          onChange={e => setFieldValue('isDaisyChained', e.target.checked)}
                          checked={[true, 'true'].includes(values.isDaisyChained)}
                        />
                      }
                      label={intl.formatMessage(messages.isDaisyChained)}
                    />
                  </>
                ) : null}

                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label={intl.formatMessage(messages.notes)}
                  value={values.notes}
                  onChange={e => setFieldValue('notes', e.target.value)}
                  multiline
                  maxRows={6}
                  minRows={3}
                />

                <TagInput
                  type="device"
                  label={intl.formatMessage(messages.tags)}
                  onChange={tags => setFieldValue('tags', tags)}
                  value={values.tags}
                />

                <Stack sx={{ gap: 2, flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <AspectButton
                    type="button"
                    disabled={!dirty}
                    onClick={() => resetForm()}
                    color="primary"
                    variant="contained"
                  >
                    {intl.formatMessage(messages.discard)}
                  </AspectButton>
                  <Button type="submit" color="primary" variant="contained" disabled={!dirty || !isValid || submitting}>
                    {intl.formatMessage(messages.save)}
                  </Button>
                </Stack>
              </Form>
            )}
          </Formik>
        </Card>
      </section>
    </div>
  )
}

DeviceDetailEdit.propTypes = {
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
  deviceTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  editable: PropTypes.bool.isRequired,
}

export default DeviceDetailEdit
