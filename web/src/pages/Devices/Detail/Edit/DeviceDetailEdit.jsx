import React, { useState } from 'react'
import { Button, Card, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material'
import { Form, Formik } from 'formik'
import get from 'lodash/get'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  CepheidInstrumentModelSelect,
  CepheidSoftwareTypeSelect,
  ImplementingPartnerSelect,
  SiteSelect,
  TagInput,
} from '../../../../components'
import AspectButton from '../../../../components/shared/AspectButton'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
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

  const validationSchema = getValidationSchema(intl.formatMessage)

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
            {({ values, errors, setFieldValue, dirty, isValid }) => (
              <Form>
                <div className={styles.formGrid}>
                  {/* ── Overview ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionOverview)} />
                  <SiteSelect
                    id="siteId"
                    name="siteId"
                    label={intl.formatMessage(messages.location)}
                    value={values.siteId || ''}
                    onChange={e => setFieldValue('siteId', e.target.value)}
                    disabled={!editable}
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

                  {/* ── Maintenance — GeneXpert only (isDaisyChained is the only editable field) ── */}
                  {isGeneXpert && (
                    <>
                      <SectionDivider label={intl.formatMessage(messages.sectionMaintenance)} />
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
                    </>
                  )}

                  {/* ── Usage ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionUsage)} />
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

                  {/* ── Technical Details — GeneXpert only ── */}
                  {isGeneXpert && (
                    <>
                      <SectionDivider label={intl.formatMessage(messages.sectionTechnicalDetails)} />
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
                      <TextField
                        id="stickerInstrumentSerial"
                        name="stickerInstrumentSerial"
                        margin="none"
                        label={intl.formatMessage(messages.stickerInstrumentSerial)}
                        value={values.stickerInstrumentSerial}
                        onChange={e => setFieldValue('stickerInstrumentSerial', e.target.value)}
                      />
                    </>
                  )}

                  {/* ── Additional Information ── */}
                  <SectionDivider label={intl.formatMessage(messages.sectionAdditionalInfo)} />
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
                      onClick={() => navigate(`/browse/device/list/${device.id}${location.search}`)}
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
