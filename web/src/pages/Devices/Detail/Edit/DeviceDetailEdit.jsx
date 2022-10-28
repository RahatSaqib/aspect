import React, { useState } from 'react'
import { Button, Card, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import isEqual from 'lodash/isEqual'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import useI18n from '../../../../hooks/useI18n'
import SiteSelectField from '../../../../oldComponents/filter/resource/SiteSelectField'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import TagInput from '../../../../oldComponents/shared/TagInput'
import ButtonGroup from '../../../../oldComponents/themedReactToolbox/ButtonGroup'
import FormGroup from '../../../../oldComponents/themedReactToolbox/FormGroup'
import styles from '../DeviceDetail.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

export const DeviceDetailEdit = ({ device, deviceTags, editable }) => {
  const navigate = useNavigate()
  const intl = useI18n()

  const { mutate: updateDevice } = useUpdateDevice(device.id)
  const { mutate: updateDeviceTags } = useUpdateTagByTypeAndId('device', device.id)
  const [editDevice, setEditDevice] = useState({ ...device })
  const [editDeviceTags, setEditDeviceTags] = useState([...deviceTags])
  const isPristine = isEqual(device, editDevice) && isEqual(deviceTags, editDeviceTags)
  const isError = false

  const onDiscardClick = () => {
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
        updateDevice(editDevice, { onSuccess: navigate(`/browse/device/${device.id}`) })
      },
    })
  }

  return (
    <div>
      <Helmet title={device.name} />
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="name"
              label={intl.formatMessage(messages.name)}
              value={device.name}
              onChange={e => setEditDevice({ ...editDevice, name: e.target.value })}
            />
            <TextField
              fullWidth
              id="shortName"
              label={intl.formatMessage(messages.shortName)}
              value={device.shortName}
              onChange={e => setEditDevice({ ...editDevice, shortName: e.target.value })}
            />
            <SiteSelectField
              name="siteId"
              floatingLabelText={intl.formatMessage(messages.location)}
              disabled={!editable}
              value={editDevice.siteId}
              onSiteChange={siteId => setEditDevice({ ...editDevice, siteId })}
              fullWidth
              tabIndex="0"
              aria-haspopup
            />
            <TextField
              fullWidth
              id="capacity"
              label={intl.formatMessage(messages.capacity)}
              value={device.dailyCapacity}
              onChange={e => setEditDevice({ ...editDevice, dailyCapacity: e.target.value })}
            />
            <TextField
              fullWidth
              id="notes"
              label={intl.formatMessage(messages.notes)}
              value={device.notes}
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

            <TextField
              fullWidth
              id="deviceType"
              label={intl.formatMessage(messages.deviceType)}
              value={device.deviceType.name}
              disabled
            />
            <TextField
              fullWidth
              id="serial"
              label={intl.formatMessage(messages.serial)}
              value={device.serial}
              disabled
            />
            <TextField
              fullWidth
              id="hostId"
              label={intl.formatMessage(messages.hostId)}
              value={device.hostId}
              disabled
            />
            <TextField
              fullWidth
              id="lastSeen"
              label={intl.formatMessage(messages.lastSeen)}
              value={device.lastSeen}
              disabled
            />
            <TextField
              fullWidth
              id="lastPingOn"
              label={intl.formatMessage(messages.lastPingOn)}
              value={device.lastPingOn}
              disabled
            />
            <TextField
              fullWidth
              id="createdOn"
              label={intl.formatMessage(messages.createdOn)}
              value={device.createdOn}
              disabled
            />

            <div className={cssClasses('Form__Actions')}>
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
                <Button color="primary" variant="contained" onClick={handleSubmit} disabled={isPristine || isError}>
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
// For editing the fields should be:
//    Default Reportable site it should be a dropdown with the sites available.
//    Device Capacity
//    name
//    shortName
//    notes

// For Read-Only:
//    Device Type
//    serial
//    hostId
//    lastSeenOn
//    lastPingOn
//    createdOn

// Missing fiedls:
// tags?
// macAddress
// culture
// timezone
// lastPingFromIp
// putInService
// putInServiceSource
// updatedOn
// updatedBy
// customFieldsSentOn
// connectSettingsSentOn
// lastInstrumentSerial
