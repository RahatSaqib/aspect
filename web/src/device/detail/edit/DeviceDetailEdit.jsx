import _ from 'lodash'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import React from 'react'
import Immutable from 'immutable'
import { compose, withStateHandlers, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Button } from 'react-toolbox/lib/button'
import { Card } from 'react-toolbox/lib/card'
import { Input } from 'react-toolbox/lib/input'
import Helmet from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import recomposeForm from '../../../components/recomposeForm'
import FormGroup from '../../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../../components/themedReactToolbox/ButtonGroup'
import SiteSelectField from '../../../filter/resource/SiteSelectField'
import ConnectedTagInput from '../../../tag/ConnectedTagInput'
import { fetchDeviceTypesForSelectList } from '../../../deviceType/DeviceTypeRedux'
import { fetchTags, updateTags } from '../../../tag/TagRedux'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const messages = defineMessages({
  deviceType: {
    id: 'pages.DeviceDetailEdit.deviceType',
    defaultMessage: 'Device type',
  },
  requirePrinter: {
    id: 'pages.DeviceDetailEdit.requirePrinter',
    defaultMessage: 'Require printer',
  },
  yes: {
    id: 'pages.DeviceDetailEdit.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.DeviceDetailEdit.no',
    defaultMessage: 'No',
  },
  tags: {
    id: 'pages.DeviceDetailEdit.tags',
    defaultMessage: 'Tags',
  },
  hostId: {
    id: 'pages.DeviceDetailEdit.hostId',
    defaultMessage: 'Host ID',
  },
  adminPassword: {
    id: 'pages.DeviceDetailEdit.adminPassword',
    defaultMessage: 'Administrator password',
  },
  location: {
    id: 'pages.DeviceDetailEdit.location',
    defaultMessage: 'Location',
  },
  firmware: {
    id: 'pages.DeviceDetailEdit.firmware',
    defaultMessage: 'Firmware',
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

const initializeValuesFrom = device => ({
  deviceTypeId: device.get('deviceTypeId'),
  requirePrinter: device.getIn(['configurationData', 'requirePrinter']),
  adminPassword: device.getIn(['configurationData', 'adminPassword']),
  siteId: device.get('siteId'),
})

const enhance = compose(
  connect(
    (state, props) => {
      const deviceTags = state.tag.tags.getIn(
        ['device', props.device.get('id')],
        Immutable.List()
      )

      return {
        deviceTypeSelectList: state.deviceType.selectList,
        deviceTags,
      }
    },
    bindActionCreators.bind(null, {
      fetchDeviceTypesForSelectList,
      fetchTags,
      updateTags,
    })
  ),
  withStateHandlers(
    ({ device }) => ({
      values: initializeValuesFrom(device),
    }),
    {
      onDeviceTypeClick: ({ values }) => ({
        target: { dataset: { value } },
      }) => ({
        values: {
          ...values,
          deviceTypeId: value,
        },
      }),

      onRequirePrinterClick: ({ values }) => ({
        target: { dataset: { value } },
      }) => ({
        values: {
          ...values,
          requirePrinter: value,
        },
      }),

      onChange: () => values => ({
        values,
      }),

      onDiscardClick: ($, { device }) => () => ({
        values: initializeValuesFrom(device),
      }),
    }
  ),
  withHandlers({
    onInitialLoad: ({
      device,
      fetchDeviceTypesForSelectList,
      fetchTags,
    }) => () => {
      fetchDeviceTypesForSelectList()
      fetchTags(device.get('id'), 'device')
    },

    onSubmit: ({ device, updateSingleDevice }) => values =>
      updateSingleDevice(device.get('id'), {
        siteId: values.siteId,
        configurationData: device
          .getIn(['deviceType', 'configurationDataSchema'])
          .map(($, key) => values[key])
          .toJS(),
      }),

    onDeviceTagChange: ({ updateTags }) => (qryId, qryType, tags) => {
      updateTags(qryId, qryType, tags.join(','))
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'adminPassword',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'siteId',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate(values) {
      const errors = {}
      //
      if (!values.siteId) {
        errors.siteId = 'Required'
      }
      return errors
    },
  })
)

export const DeviceDetailEdit = ({
  intl,
  history,
  location,
  match,
  device,
  editable,
  // --- injected by recompose ---
  deviceTypeSelectList,
  deviceTags,
  form,
  meta,
  values,
  onDeviceTypeClick,
  onRequirePrinterClick,
  onAdminPasswordChange,
  onSiteIdChange,
  onDiscardClick,
  handleSubmit,
  onDeviceTagChange,
}) => (
  <div>
    <Helmet title={device.get('name')} />
    <DeviceDetailBackBar
      intl={intl}
      history={history}
      location={location}
      match={match}
      title={device.get('name')}
    />
    <section className={cssClasses('Section', 'Section--first')}>
      <Card className={cssClasses('Section__Content')}>
        <form onSubmit={handleSubmit}>
          <FormGroup label={intl.formatMessage(messages.deviceType)}>
            <ButtonGroup isolated>
              {deviceTypeSelectList.items.map(deviceType => (
                // FIXME: Can deviceTypeId editable?
                <Button
                  key={deviceType.get('id')}
                  primary
                  raised
                  inverse={deviceType.get('id') !== values.deviceTypeId}
                  label={deviceType.get('name')}
                  data-value={deviceType.get('id')}
                  onClick={onDeviceTypeClick}
                />
              ))}
            </ButtonGroup>
          </FormGroup>
          {device.hasIn([
            'deviceType',
            'configurationDataSchema',
            'requirePrinter',
          ]) && (
            <FormGroup label={intl.formatMessage(messages.requirePrinter)}>
              <ButtonGroup isolated>
                {[
                  {
                    value: 'yes',
                    label: intl.formatMessage(messages.yes),
                  },
                  {
                    value: 'no',
                    label: intl.formatMessage(messages.no),
                  },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    primary
                    raised
                    inverse={values.requirePrinter !== value}
                    label={label}
                    data-value={value}
                    onClick={onRequirePrinterClick}
                  />
                ))}
              </ButtonGroup>
            </FormGroup>
          )}
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
          <Input
            type="text"
            name="hostId"
            disabled
            label={intl.formatMessage(messages.hostId)}
            value={device.get('hostId')}
            maxLength={500}
          />
          {device.hasIn([
            'deviceType',
            'configurationDataSchema',
            'adminPassword',
          ]) && (
            <Input
              type="text"
              name="adminPassword"
              label={intl.formatMessage(messages.adminPassword)}
              disabled={form.submitting}
              value={values.adminPassword}
              onChange={onAdminPasswordChange}
              error={meta.adminPassword.touched && meta.adminPassword.error}
              maxLength={500}
            />
          )}
          <SiteSelectField
            name="siteId"
            floatingLabelText={intl.formatMessage(messages.location)}
            disabled={form.submitting}
            value={values.siteId}
            onSiteChange={onSiteIdChange}
            errorStyle={{
              float: 'left',
              whiteSpace: 'nowrap',
              textOverflow: 'visible',
            }}
            errorText={meta.siteId.touched && meta.siteId.error}
            fullWidth
            tabIndex="0"
            aria-haspopup
          />
          {device.hasIn([
            'deviceType',
            'configurationDataSchema',
            'firmwareUpdateRequired',
          ]) && (
            <FormGroup label={intl.formatMessage(messages.firmware)}>
              "TODO: 72.43.102"
            </FormGroup>
          )}
          <div className={cssClasses('Form__Actions')}>
            <ButtonGroup isolated>
              <Button
                type="button"
                label={intl.formatMessage(messages.discard)}
                disabled={form.pristine}
                onClick={onDiscardClick}
                raised
                primary
              />
              <Button
                type="submit"
                label={intl.formatMessage(messages.save)}
                disabled={form.pristine || !form.valid || form.submitting}
                raised
                primary
              />
            </ButtonGroup>
          </div>
        </form>
      </Card>
    </section>
  </div>
)

export default enhance(DeviceDetailEdit)
