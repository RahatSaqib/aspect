import React, { useState } from 'react'
import { Button, Card, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { useNavigate } from 'react-router-dom'
import { ImplementingPartnerSelect } from '../../../../cleanComponents'
import DeviceCapacitySelect from '../../../../cleanComponents/DeviceCapacitySelect'
import useUpdateDevice from '../../../../hooks/device/useUpdateDevice'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import useI18n from '../../../../hooks/useI18n'
import SiteSelectField from '../../../../oldComponents/resource/SiteSelectField'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import TagInput from '../../../../oldComponents/shared/TagInput'
import ButtonGroup from '../../../../oldComponents/themedReactToolbox/ButtonGroup'
import FormGroup from '../../../../oldComponents/themedReactToolbox/FormGroup'
import styles from '../styles.css'
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
  const [isError, setError] = useState(false)

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
        updateDevice(editDevice, { onSuccess: navigate(`/browse/device/list/${device.id}`) })
      },
    })
  }

  return (
    <div>
      <Helmet title={device.name} />
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
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
