import _ from 'lodash'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import React from 'react'
import Immutable from 'immutable'
import { compose, withStateHandlers, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Card from '@material-ui/core/Card'
import Helmet from 'react-helmet'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import recomposeForm from '../../../components/recomposeForm'
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

const initializeValuesFrom = device => ({
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
        deviceTags,
      }
    },
    bindActionCreators.bind(null, {
      fetchTags,
      updateTags,
    })
  ),
  withStateHandlers(
    ({ device }) => ({
      values: initializeValuesFrom(device),
    }),
    {
      onChange: () => values => ({
        values,
      }),

      onDiscardClick: ($, { device }) => () => ({
        values: initializeValuesFrom(device),
      }),
    }
  ),
  withHandlers({
    onInitialLoad: ({ device, fetchTags }) => () => {
      fetchTags(device.get('id'), 'device')
    },

    onSubmit: ({ device, updateSingleDevice }) => values =>
      updateSingleDevice(device.get('id'), {
        siteId: values.siteId,
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
        fieldName: 'siteId',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate(values) {
      const errors = {}
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
  deviceTags,
  form,
  meta,
  values,
  onSiteIdChange,
  onDiscardClick,
  handleSubmit,
  onDeviceTagChange,
}) => {
  const deviceName = device.get('name')
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
          <form onSubmit={handleSubmit}>
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
}

export default enhance(DeviceDetailEdit)
