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
import AspectButton from '../../../../components/shared/AspectButton'
import Summary from '../../../../components/Summary'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
import { formatRelative } from '../../../../utils/utils/dateFormat'
import profileMessages from '../Profile/messages'
import styles from '../styles.module.css'
import messages from './messages'
import { getValidationSchema } from './validation'

const SectionDivider = ({ label }) => (
  <div className={styles.sectionDivider}>
    <span className={styles.sectionDivider__label}>{label}</span>
    <span className={styles.sectionDivider__line} />
  </div>
)

const DeviceDetailEdit = ({ device, deviceTags, editable }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const intl = useIntl()

  const { mutate: updateDevice } = useUpdateDevice(device.id)
  const { mutate: updateDeviceTags } = useUpdateTagByTypeAndId('device', device.id)
  const [submitting, setSubmitting] = useState(false)

  const isGeneXpert = get(device, 'deviceType.externalId') === CONSTS.GENEXPERT_EXTERNAL_ID

  // Read-only display helpers
  const na = intl.formatMessage(profileMessages.undefinedValue)
  const maintenanceStatusText = device.maintenanceStatusI18nKey
    ? intl.formatMessage(profileMessages[device.maintenanceStatusI18nKey])
    : na
  const formatMaintenanceDate = date => (date ? intl.formatDate(date) : na)
  const formatRate = value =>
    value !== null && value !== undefined ? intl.formatNumber(value, { style: 'percent' }) : na

  // Create validation schema using imported function
  const validationSchema = getValidationSchema(intl.formatMessage)

  // Create initial values for Formik
  // name and shortName are kept so they are included in the API payload but are not rendered as inputs
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
    isDaisyChained: device.isDaisyChained || false,
    notes: device.notes,
    tags: deviceTags || [],
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
                <div className={styles.formGrid}>
                  {/* ── Identity band (no section title) ── */}
                  <SiteSelect
                    id="siteId"
                    name="siteId"
                    label={intl.formatMessage(messages.location)}
                    value={values.siteId || ''}
                    onChange={e => setFieldValue('siteId', e.target.value)}
                    disabled={!editable}
                  />
                  <Summary
                    title={intl.formatMessage(profileMessages.deviceType)}
                    description={get(device, 'deviceType.name')}
                  />
                  <Summary
                    title={intl.formatMessage(profileMessages.approval)}
                    description={
                      device.approvalStatusI18nKey
                        ? intl.formatMessage(profileMessages[device.approvalStatusI18nKey])
                        : na
                    }
                  />
                  <Summary
                    title={intl.formatMessage(profileMessages.connectivity)}
                    description={intl.formatMessage(profileMessages.lastSeen, {
                      lastSeen: formatRelative(device.lastPingOn, intl.formatRelativeTime),
                    })}
                  />

                  {/* ── Capacity & Modules — GeneXpert only ── */}
                  {isGeneXpert && (
                    <>
                      <SectionDivider label={intl.formatMessage(messages.sectionCapacityModules)} />
                      <TextField
                        label={intl.formatMessage(messages.gx6cModulesCount)}
                        type="number"
                        name="gx6cModulesCount"
                        margin="none"
                        error={Boolean(errors.gx6cModulesCount)}
                        helperText={errors.gx6cModulesCount}
                        value={values.gx6cModulesCount ?? 0}
                        onChange={e => setFieldValue('gx6cModulesCount', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label={intl.formatMessage(messages.gx10cModulesCount)}
                        type="number"
                        name="gx10cModulesCount"
                        margin="none"
                        error={Boolean(errors.gx10cModulesCount)}
                        helperText={errors.gx10cModulesCount}
                        value={values.gx10cModulesCount ?? 0}
                        onChange={e => setFieldValue('gx10cModulesCount', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label={intl.formatMessage(messages.moduleBayCapacity)}
                        type="number"
                        name="moduleBayCapacity"
                        margin="none"
                        error={Boolean(errors.moduleBayCapacity)}
                        helperText={errors.moduleBayCapacity}
                        value={values.moduleBayCapacity}
                        onChange={e => setFieldValue('moduleBayCapacity', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </>
                  )}

                  {/* ── Maintenance ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionMaintenance)} />
                  <Summary
                    title={intl.formatMessage(profileMessages.maintenance)}
                    description={maintenanceStatusText}
                  />
                  <Summary
                    title={intl.formatMessage(profileMessages.calibration)}
                    description={formatMaintenanceDate(device.calibrationDate)}
                  />
                  <Summary
                    title={intl.formatMessage(profileMessages.warranty)}
                    description={formatMaintenanceDate(device.warrantyDueDate)}
                  />
                  {isGeneXpert ? (
                    <FormControlLabel
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
                  ) : (
                    <Summary
                      title={intl.formatMessage(profileMessages.isDaisyChained)}
                      description={device.isDaisyChained ? 'True' : 'False'}
                    />
                  )}

                  {/* ── Usage ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionUsage)} />
                  {device.utilizationRateThisMonth !== null && (
                    <Summary
                      title={intl.formatMessage(profileMessages.utilizationRate)}
                      description={formatRate(device.utilizationRateThisMonth)}
                    />
                  )}
                  <Summary
                    title={intl.formatMessage(profileMessages.errorRate)}
                    description={formatRate(device.errorRateThisMonth)}
                  />
                  <TextField
                    label={intl.formatMessage(messages.dailyTestCapacity)}
                    type="number"
                    name="dailyTestCapacity"
                    margin="none"
                    error={Boolean(errors.dailyTestCapacity)}
                    helperText={errors.dailyTestCapacity}
                    value={values.dailyTestCapacity}
                    onChange={e => setFieldValue('dailyTestCapacity', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />

                  {/* ── Technical Details ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionTechnicalDetails)} />
                  <Summary title={intl.formatMessage(messages.serial)} description={device.serial} />
                  <Summary title={intl.formatMessage(messages.hostId)} description={device.hostId} />
                  {isGeneXpert ? (
                    <CepheidInstrumentModelSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.instrumentModel)}
                      value={values.instrumentModel}
                      onChange={instrumentModel => setFieldValue('instrumentModel', instrumentModel)}
                    />
                  ) : (
                    <Summary
                      title={intl.formatMessage(messages.instrumentModel)}
                      description={device.instrumentModel ?? na}
                    />
                  )}
                  {isGeneXpert ? (
                    <CepheidSoftwareTypeSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.softwareType)}
                      value={values.softwareType}
                      onChange={softwareType => setFieldValue('softwareType', softwareType)}
                    />
                  ) : (
                    <Summary
                      title={intl.formatMessage(messages.softwareType)}
                      description={device.softwareType ?? na}
                    />
                  )}
                  {isGeneXpert ? (
                    <TextField
                      id="stickerInstrumentSerial"
                      name="stickerInstrumentSerial"
                      margin="none"
                      label={intl.formatMessage(messages.stickerInstrumentSerial)}
                      value={values.stickerInstrumentSerial}
                      onChange={e => setFieldValue('stickerInstrumentSerial', e.target.value)}
                    />
                  ) : (
                    <Summary
                      title={intl.formatMessage(messages.stickerInstrumentSerial)}
                      description={device.stickerInstrumentSerial ?? na}
                    />
                  )}

                  {/* ── Additional Information ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionAdditionalInfo)} />
                  <Summary
                    title={intl.formatMessage(messages.createdOn)}
                    description={formatRelative(device.createdOn, intl.formatRelativeTime)}
                  />
                  <div className={styles.formGrid__fullWidth}>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      margin="none"
                      label={intl.formatMessage(messages.notes)}
                      value={values.notes}
                      onChange={e => setFieldValue('notes', e.target.value)}
                      multiline
                      maxRows={6}
                      minRows={3}
                    />
                  </div>
                  <div className={styles.formGrid__fullWidth}>
                    <TagInput
                      type="device"
                      label={intl.formatMessage(messages.tags)}
                      onChange={tags => setFieldValue('tags', tags)}
                      value={values.tags}
                    />
                  </div>
                  <div className={styles.formGrid__fullWidth}>
                    <ImplementingPartnerSelect
                      valueBy="value"
                      label={intl.formatMessage(messages.partner)}
                      value={values.implementingPartnerId ?? null}
                      onChange={implementingPartnerId => setFieldValue('implementingPartnerId', implementingPartnerId)}
                    />
                  </div>

                  {/* ── Actions ── */}
                  <Stack
                    className={styles.formGrid__fullWidth}
                    sx={{ gap: 2, flexDirection: 'row', justifyContent: 'flex-end', pt: 1 }}
                  >
                    <AspectButton
                      type="button"
                      disabled={!dirty}
                      onClick={() => resetForm()}
                      color="primary"
                      variant="contained"
                    >
                      {intl.formatMessage(messages.discard)}
                    </AspectButton>
                    <Button
                      type="submit"
                      color="primary"
                      variant="contained"
                      disabled={!dirty || !isValid || submitting}
                    >
                      {intl.formatMessage(messages.save)}
                    </Button>
                  </Stack>
                </div>
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
