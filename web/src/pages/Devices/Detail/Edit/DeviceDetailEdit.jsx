import React, { useState } from 'react'
import { Button, Checkbox, Card, FormControlLabel, TextField } from '@mui/material'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import values from 'lodash/values'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ImplementingPartnerSelect,
  DeviceCapacitySelect,
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

  const onDiscardClick = () => {
    setError({})
    setEditDevice({ ...device })
    setEditDeviceTags([...deviceTags])
  }

  const onAddTag = tagName => {
    if (tagName.trim().length === 0) return
    if (editDeviceTags.some(deviceTag => deviceTag.title.toLowerCase() === tagName.toLowerCase())) return

    setEditDeviceTags([...editDeviceTags, { title: tagName }])
  }

  const onDeleteTag = tag => {
    setEditDeviceTags(editDeviceTags.filter(deviceTag => deviceTag !== tag))
  }

  const handleSubmit = async () => {
    updateDeviceTags(editDeviceTags.map(deviceTag => deviceTag.title).join(','), {
      onSuccess: () => {
        updateDevice(editDevice, { onSuccess: navigate(`/browse/device/list/${device.id}${location.search}`) })
      },
    })
  }

  return (
    <div>
      <Helmet title={device.name} />
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <Card className={styles.Section__Content}>
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
                setError(isEmpty(e.target.value))
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
                setError(isEmpty(e.target.value))
              }}
            />
            <SiteSelect
              id="siteId"
              name="siteId"
              label={intl.formatMessage(messages.location)}
              value={editDevice?.siteId || ''}
              onChange={e => setEditDevice({ ...editDevice, siteId: e.target.value })}
              disabled={!editable}
            />

            <ImplementingPartnerSelect
              valueBy="value"
              label={intl.formatMessage(messages.partner)}
              value={editDevice?.implementingPartnerId ?? null}
              onChange={implementingPartnerId => setEditDevice(prv => ({ ...prv, implementingPartnerId }))}
            />

            <DeviceCapacitySelect
              name="capacity"
              deviceTypeId={editDevice.deviceType.externalId}
              label={intl.formatMessage(messages.capacity)}
              value={editDevice.dailyCapacityId}
              onChange={dailyCapacityId => setEditDevice({ ...editDevice, dailyCapacityId })}
            />

            <TextField
              label={intl.formatMessage(messages.moduleBayCapacity)}
              type="number"
              error={error?.moduleBayCapacity}
              value={editDevice.moduleBayCapacity}
              onChange={({ target: { value } }) => {
                setError(error => ({ ...error, moduleBayCapacity: Number(value) < 1 || Number(value) > 256 }))
                setEditDevice({ ...editDevice, moduleBayCapacity: value ? parseInt(value, 10) : '' })
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
                setError(error => ({ ...error, instrumentsConnected: Number(value) <= 0 }))
                setEditDevice({ ...editDevice, instrumentsConnected: value ? parseInt(value, 10) : '' })
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
                    setError(error => ({ ...error, gx6cModulesCount: Number(value) < 0 }))
                    setEditDevice({ ...editDevice, gx6cModulesCount: value ? parseInt(value, 10) : '' })
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
                    setError(error => ({ ...error, gx10cModulesCount: Number(value) < 0 }))
                    setEditDevice({ ...editDevice, gx10cModulesCount: value ? parseInt(value, 10) : '' })
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
                  onChange={e => setEditDevice({ ...editDevice, stickerInstrumentSerial: e.target.value })}
                />

                <CepheidInstrumentModelSelect
                  valueBy="value"
                  label={intl.formatMessage(messages.instrumentModel)}
                  value={editDevice.instrumentModel}
                  onChange={instrumentModel => setEditDevice(prv => ({ ...prv, instrumentModel }))}
                />

                <CepheidSoftwareTypeSelect
                  valueBy="value"
                  label={intl.formatMessage(messages.softwareType)}
                  value={editDevice.softwareType}
                  onChange={softwareType => setEditDevice(prv => ({ ...prv, softwareType }))}
                />

                <FormControlLabel
                  sx={{ mb: '20px' }}
                  control={
                    <Checkbox
                      type="checkbox"
                      onChange={isDaisyChained =>
                        setEditDevice(prv => ({ ...prv, isDaisyChained: isDaisyChained.target.checked }))
                      }
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
              onChange={e => setEditDevice({ ...editDevice, notes: e.target.value })}
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
                onAdd={onAddTag}
                onDelete={onDeleteTag}
                disabled={!editable}
              />
            </FormGroup>

            <div className={styles.Form__Actions}>
              <ButtonGroup isolated>
                <AspectButton
                  type="button"
                  disabled={isPristine}
                  onClick={onDiscardClick}
                  color="primary"
                  variant="contained"
                >
                  {intl.formatMessage(messages.discard)}
                </AspectButton>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isPristine || !values(error).every(v => v === false)}
                >
                  {intl.formatMessage(messages.save)}
                </Button>
              </ButtonGroup>
            </div>
          </form>
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
