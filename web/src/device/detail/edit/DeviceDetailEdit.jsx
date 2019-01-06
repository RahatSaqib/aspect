import _ from 'lodash'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import React from 'react'
import Immutable from 'immutable'
import { compose, withStateHandlers, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'
import TextField from '@material-ui/core/TextField'
import Helmet from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import recomposeForm from '../../../components/recomposeForm'
import FormGroup from '../../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../../components/themedReactToolbox/ButtonGroup'
import AspectButton from '../../../components/shared/AspectButton'
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
      onDeviceTypeClick: ({ values }) => value => ({
        values: {
          ...values,
          deviceTypeId: value,
        },
      }),
      onRequirePrinterClick: ({ values }) => value => ({
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
        valueFromChangeEvent: it => it.target.value,
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
                <AspectButton
                  key={deviceType.get('id')}
                  color="primary"
                  variant="contained"
                  inverse={deviceType.get('id') !== values.deviceTypeId}
                  data-value={deviceType.get('id')}
                  onClick={({ currentTarget: { dataset: { value } } }) =>
                    onDeviceTypeClick(value)
                  }
                >
                  {deviceType.get('name')}
                </AspectButton>
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
                  <AspectButton
                    key={value}
                    color="primary"
                    variant="contained"
                    inverse={values.requirePrinter !== value}
                    data-value={value}
                    onClick={({ currentTarget: { dataset: { value } } }) =>
                      onRequirePrinterClick(value)
                    }
                  >
                    {label}
                  </AspectButton>
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
          <TextField
            fullWidth
            type="text"
            name="hostId"
            disabled
            label={intl.formatMessage(messages.hostId)}
            value={device.get('hostId')}
            margin="normal"
            FormHelperTextProps={{
              margin: 'dense',
            }}
            inputProps={{ maxLength: 500 }}
          />
          {device.hasIn([
            'deviceType',
            'configurationDataSchema',
            'adminPassword',
          ]) && (
            <TextField
              fullWidth
              type="text"
              name="adminPassword"
              label={intl.formatMessage(messages.adminPassword)}
              disabled={form.submitting}
              value={values.adminPassword}
              onChange={onAdminPasswordChange}
              error={meta.adminPassword.touched && meta.adminPassword.error}
              helperText={
                meta.adminPassword.touched && meta.adminPassword.error
              }
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
              inputProps={{ maxLength: 500 }}
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
              <AspectButton
                type="button"
                disabled={form.pristine}
                onClick={onDiscardClick}
                color="primary"
                variant="contained"
              >
                {intl.formatMessage(messages.discard)}
              </AspectButton>
              <AspectButton
                type="submit"
                disabled={form.pristine || !form.valid || form.submitting}
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

export default enhance(DeviceDetailEdit)
