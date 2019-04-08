import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import React, { useEffect, useState } from 'react'
import Immutable from 'immutable'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'
import Helmet from 'react-helmet'

import DeviceDetailBackBar from '../DeviceDetailBackBar'
import FormGroup from '../../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../../components/themedReactToolbox/ButtonGroup'
import AspectButton from '../../../components/shared/AspectButton'
import SiteSelectField from '../../../filter/resource/SiteSelectField'
import ConnectedTagInput from '../../../tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../../tag/TagRedux'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const messages = defineMessages({
  tags: {
    id: 'pages.DeviceDetailEdit.tags',
    defaultMessage: 'Tags',
  },
  location: {
    id: 'pages.DeviceDetailEdit.location',
    defaultMessage: 'Site',
  },
  discard: {
    id: 'pages.DeviceDetailEdit.discard',
    defaultMessage: 'Discard',
  },
  save: {
    id: 'pages.DeviceDetailEdit.save',
    defaultMessage: 'Save',
  },
})

const DeviceDetailEdit = ({
  intl,
  history,
  location,
  match,
  device,
  editable,
  deviceTags,
  fetchTags,
  updateTags,
  updateSingleDevice,
}) => {
  const initialSiteId = device.get('siteId')
  const [siteId, setSiteId] = useState(initialSiteId)
  useEffect(() => {
    fetchTags(device.get('id'), 'device')
  }, [])

  const onSubmit = event => {
    event.preventDefault()
    updateSingleDevice(device.get('id'), {
      siteId,
    })
  }

  const onChange = siteId => {
    setSiteId(siteId)
  }

  const onDiscardClick = () => setSiteId(initialSiteId)

  const onDeviceTagChange = (qryId, qryType, tags) => {
    updateTags(qryId, qryType, tags.join(','))
  }
  const deviceName = `${device.getIn(['deviceType', 'name'])} at ${device.get(
    'siteName'
  )}`
  return (
    <div>
      <Helmet title={deviceName} />
      <DeviceDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        title={deviceName}
      />
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <form onSubmit={onSubmit}>
            <SiteSelectField
              name="siteId"
              floatingLabelText={intl.formatMessage(messages.location)}
              // disabled={form.submitting}
              value={siteId}
              onSiteChange={onChange}
              fullWidth
              tabIndex="0"
              aria-haspopup
            />

            <FormGroup label={intl.formatMessage(messages.tags)}>
              <ConnectedTagInput
                qryId={device.get('id')}
                qryType="device"
                label="Choose countries"
                allowCreate
                disabled={!editable}
                onTagChange={onDeviceTagChange}
                value={deviceTags.toJS()}
              />
            </FormGroup>
            <div className={cssClasses('Form__Actions')}>
              <ButtonGroup isolated>
                <AspectButton
                  type="button"
                  // disabled={form.pristine}
                  onClick={onDiscardClick}
                  color="primary"
                  variant="contained"
                >
                  {intl.formatMessage(messages.discard)}
                </AspectButton>
                <AspectButton
                  type="submit"
                  // disabled={form.pristine || !form.valid || form.submitting}
                  color="primary"
                  variant="contained"
                >
                  {intl.formatMessage(messages.save)}
                </AspectButton>
              </ButtonGroup>
            </div>
          </form>
        </Card>
      </section>
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const deviceTags = state.tag.tags.getIn(
    ['device', ownProps.device.get('id')],
    Immutable.List()
  )
  return {
    deviceTags,
  }
}

export default connect(mapStateToProps, {
  fetchTags,
  updateTags,
})(DeviceDetailEdit)
