import React, { useState } from 'react'
import { Button, Checkbox, Card, FormControlLabel, TextField } from '@mui/material'
import { Formik } from 'formik'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import lodashValues from 'lodash/values'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ImplementingPartnerSelect,
  SiteSelect,
  CepheidInstrumentModelSelect,
  CepheidSoftwareTypeSelect,
} from '../../../../cleanComponents'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import TagInput from '../../../../oldComponents/shared/TagInput'
import ButtonGroup from '../../../../oldComponents/themedReactToolbox/ButtonGroup'
import FormGroup from '../../../../oldComponents/themedReactToolbox/FormGroup'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
import styles from '../styles.module.css'
import messages from './messages'

const DeviceDetailEdit = ({ device, deviceTags, editable }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useIntl()

  const { mutate: updateDevice } = useUpdateDevice(device.id)
  const { mutate: updateDeviceTags } = useUpdateTagByTypeAndId('device', device.id)
  const [editDevice, setEditDevice] = useState({ ...device })
  const [editDeviceTags, setEditDeviceTags] = useState([...deviceTags])
  const isPristine = isEqual(device, editDevice) && isEqual(deviceTags, editDeviceTags)
  const [error, setError] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Validation function to check a single numeric field
  const validateNumericField = (value, min, max) => {
    if (value === '' || value === null || value === undefined) return false
    if (Number.isNaN(Number(value))) return false
    const numValue = Number(value)
    if (min !== undefined && numValue < min) return true
    if (max !== undefined && numValue > max) return true
    return false
  }

  // Initial validation on component mount and when device changes
  React.useEffect(() => {
    const initialErrors = {
      dailyTestCapacity: validateNumericField(editDevice.dailyTestCapacity, 1, 9999),
      moduleBayCapacity: validateNumericField(editDevice.moduleBayCapacity, 1, 256),
      instrumentsConnected: validateNumericField(editDevice.instrumentsConnected, 1),
      gx6cModulesCount: validateNumericField(editDevice.gx6cModulesCount, 0),
      gx10cModulesCount: validateNumericField(editDevice.gx10cModulesCount, 0),
    }
    setError(initialErrors)
  }, [
    editDevice.dailyTestCapacity,
    editDevice.moduleBayCapacity,
    editDevice.instrumentsConnected,
    editDevice.gx6cModulesCount,
    editDevice.gx10cModulesCount,
  ])

  // Create initial values for Formik (using actual device data without defaults)
  const initialValues = {
    name: device.name,
    shortName: device.shortName,
    siteId: device.siteId,
    implementingPartnerId: device.implementingPartnerId,
    dailyTestCapacity: device.dailyTestCapacity,
    moduleBayCapacity: device.moduleBayCapacity,
    instrumentsConnected: device.instrumentsConnected,
    gx6cModulesCount: device.gx6cModulesCount,
    gx10cModulesCount: device.gx10cModulesCount,
    stickerInstrumentSerial: device.stickerInstrumentSerial,
    instrumentModel: device.instrumentModel,
    softwareType: device.softwareType,
    isDaisyChained: device.isDaisyChained,
    notes: device.notes,
    tags: deviceTags,
  }

  const onDiscardClick = resetForm => {
    setError({})
    setEditDevice({ ...device })
    setEditDeviceTags([...deviceTags])
    // Reset Formik form to initial values
    if (resetForm) {
      resetForm({ values: initialValues })
    }
  }

  const onAddTag = (tagName, setFieldValue) => {
    if (tagName.trim().length === 0) return
    if (editDeviceTags.some(deviceTag => deviceTag.title.toLowerCase() === tagName.toLowerCase())) return

    const newTags = [...editDeviceTags, { title: tagName }]
    setEditDeviceTags(newTags)
    // Update Formik state as well
    if (setFieldValue) {
      setFieldValue('tags', newTags)
    }
  }

  const onDeleteTag = (tag, setFieldValue) => {
    const newTags = editDeviceTags.filter(deviceTag => deviceTag !== tag)
    setEditDeviceTags(newTags)
    // Update Formik state as well
    if (setFieldValue) {
      setFieldValue('tags', newTags)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    updateDeviceTags(editDeviceTags.map(deviceTag => deviceTag.title).join(','), {
      onError: () => setSubmitting(false),
      onSuccess: () => {
        updateDevice(editDevice, {
          onSettled: () => setSubmitting(false),
          onSuccess: () => navigate(`/browse/device/list/${device.id}${location.search}`),
        })
      },
    })
  }

  return (
    <div>
      <Helmet title={device.name} />
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <Card className={styles.Section__Content}>
          <Formik initialValues={initialValues} enableReinitialize onSubmit={handleSubmit}>
            {({ setFieldValue, resetForm }) => (
              <form>
                <TextField
                  fullWidth
                  id="name"
                  error={isEmpty(editDevice.name)}
                  required
                  label={intl.formatMessage(messages.name)}
                  value={editDevice.name}
                  onChange={e => {
                    setEditDevice({ ...editDevice, name: e.target.value })
                    setFieldValue('name', e.target.value)
                  }}
                />
                <TextField
                  fullWidth
                  id="shortName"
                  error={isEmpty(editDevice.shortName)}
                  required
                  label={intl.formatMessage(messages.shortName)}
                  value={editDevice.shortName}
                  onChange={e => {
                    setEditDevice({ ...editDevice, shortName: e.target.value })
                    setFieldValue('shortName', e.target.value)
                  }}
                />
                <SiteSelect
                  id="siteId"
                  name="siteId"
                  label={intl.formatMessage(messages.location)}
                  value={editDevice?.siteId || ''}
                  onChange={e => {
                    setEditDevice({ ...editDevice, siteId: e.target.value })
                    setFieldValue('siteId', e.target.value)
                  }}
                  disabled={!editable}
                />

                <ImplementingPartnerSelect
                  valueBy="value"
                  label={intl.formatMessage(messages.partner)}
                  value={editDevice?.implementingPartnerId ?? null}
                  onChange={implementingPartnerId => {
                    setEditDevice(prv => ({ ...prv, implementingPartnerId }))
                    setFieldValue('implementingPartnerId', implementingPartnerId)
                  }}
                />
                <TextField
                  label={intl.formatMessage(messages.dailyTestCapacity)}
                  type="number"
                  name="capacity"
                  error={error?.dailyTestCapacity}
                  value={editDevice.dailyTestCapacity}
                  onChange={({ target: { value } }) => {
                    const hasError = validateNumericField(value, 1, 9999)
                    setError(error => ({ ...error, dailyTestCapacity: hasError }))
                    setEditDevice({ ...editDevice, dailyTestCapacity: value ? parseInt(value, 10) : '' })
                    setFieldValue('dailyTestCapacity', value ? parseInt(value, 10) : '')
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label={intl.formatMessage(messages.moduleBayCapacity)}
                  type="number"
                  error={error?.moduleBayCapacity}
                  value={editDevice.moduleBayCapacity}
                  onChange={({ target: { value } }) => {
                    const hasError = validateNumericField(value, 1, 256)
                    setError(error => ({ ...error, moduleBayCapacity: hasError }))
                    setEditDevice({ ...editDevice, moduleBayCapacity: value ? parseInt(value, 10) : '' })
                    setFieldValue('moduleBayCapacity', value ? parseInt(value, 10) : '')
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label={intl.formatMessage(messages.instrumentsConnected)}
                  type="number"
                  error={error?.instrumentsConnected}
                  value={editDevice.instrumentsConnected}
                  onChange={({ target: { value } }) => {
                    const hasError = validateNumericField(value, 1)
                    setError(error => ({ ...error, instrumentsConnected: hasError }))
                    setEditDevice({ ...editDevice, instrumentsConnected: value ? parseInt(value, 10) : '' })
                    setFieldValue('instrumentsConnected', value ? parseInt(value, 10) : '')
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                {get(device, 'deviceType.externalId') === CONSTS.GENEXPERT_EXTERNAL_ID ? (
                  <>
                    <TextField
                      label={intl.formatMessage(messages.gx6cModulesCount)}
                      type="number"
                      error={error?.gx6cModulesCount}
                      value={editDevice?.gx6cModulesCount ?? 0}
                      onChange={({ target: { value } }) => {
                        const hasError = validateNumericField(value, 0)
                        setError(error => ({ ...error, gx6cModulesCount: hasError }))
                        setEditDevice({ ...editDevice, gx6cModulesCount: value ? parseInt(value, 10) : '' })
                        setFieldValue('gx6cModulesCount', value ? parseInt(value, 10) : '')
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      label={intl.formatMessage(messages.gx10cModulesCount)}
                      type="number"
                      error={error?.gx10cModulesCount}
                      value={editDevice?.gx10cModulesCount ?? 0}
                      onChange={({ target: { value } }) => {
                        const hasError = validateNumericField(value, 0)
                        setError(error => ({ ...error, gx10cModulesCount: hasError }))
                        setEditDevice({ ...editDevice, gx10cModulesCount: value ? parseInt(value, 10) : '' })
                        setFieldValue('gx10cModulesCount', value ? parseInt(value, 10) : '')
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    <TextField
                      fullWidth
                      id="stickerInstrumentSerial"
                      label={intl.formatMessage(messages.stickerInstrumentSerial)}
                      value={editDevice.stickerInstrumentSerial}
                      onChange={e => {
                        setEditDevice({ ...editDevice, stickerInstrumentSerial: e.target.value })
                        setFieldValue('stickerInstrumentSerial', e.target.value)
                      }}
                    />

                    <CepheidInstrumentModelSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.instrumentModel)}
                      value={editDevice.instrumentModel}
                      onChange={instrumentModel => {
                        setEditDevice(prv => ({ ...prv, instrumentModel }))
                        setFieldValue('instrumentModel', instrumentModel)
                      }}
                    />

                    <CepheidSoftwareTypeSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.softwareType)}
                      value={editDevice.softwareType}
                      onChange={softwareType => {
                        setEditDevice(prv => ({ ...prv, softwareType }))
                        setFieldValue('softwareType', softwareType)
                      }}
                    />

                    <FormControlLabel
                      sx={{ mb: '20px' }}
                      control={
                        <Checkbox
                          type="checkbox"
                          onChange={isDaisyChained => {
                            const { checked } = isDaisyChained.target
                            setEditDevice(prv => ({ ...prv, isDaisyChained: checked }))
                            setFieldValue('isDaisyChained', checked)
                          }}
                          checked={[true, 'true'].includes(editDevice.isDaisyChained)}
                        />
                      }
                      label={intl.formatMessage(messages.isDaisyChained)}
                    />
                  </>
                ) : null}

                <TextField
                  fullWidth
                  id="notes"
                  label={intl.formatMessage(messages.notes)}
                  value={editDevice.notes}
                  onChange={e => {
                    setEditDevice({ ...editDevice, notes: e.target.value })
                    setFieldValue('notes', e.target.value)
                  }}
                  multiline
                  maxRows={6}
                  minRows={3}
                />

                <FormGroup label={intl.formatMessage(messages.tags)}>
                  <TagInput
                    allowCreate
                    keepFocusOnChange
                    source={editDeviceTags}
                    value={editDeviceTags}
                    tagName="title"
                    onAdd={tagName => onAddTag(tagName, setFieldValue)}
                    onDelete={tag => onDeleteTag(tag, setFieldValue)}
                    disabled={!editable}
                  />
                </FormGroup>

                <div className={styles.Form__Actions}>
                  <ButtonGroup isolated>
                    <AspectButton
                      type="button"
                      disabled={isPristine}
                      onClick={() => onDiscardClick(resetForm)}
                      color="primary"
                      variant="contained"
                    >
                      {intl.formatMessage(messages.discard)}
                    </AspectButton>
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isPristine || !lodashValues(error).every(v => v === false) || submitting}
                    >
                      {intl.formatMessage(messages.save)}
                    </Button>
                  </ButtonGroup>
                </div>
              </form>
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
