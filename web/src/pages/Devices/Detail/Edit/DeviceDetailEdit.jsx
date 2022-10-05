import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
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

  const onSiteIdChange = siteId => {
    setEditDevice({ ...editDevice, siteId })
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
            <SiteSelectField
              name="siteId"
              floatingLabelText={intl.formatMessage(messages.location)}
              disabled={!editable}
              value={editDevice.siteId}
              onSiteChange={onSiteIdChange}
              fullWidth
              tabIndex="0"
              aria-haspopup
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
