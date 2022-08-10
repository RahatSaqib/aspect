import React from 'react'
import PropTypes from 'prop-types'
import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import { defineMessages, injectIntl } from 'react-intl'
import Immutable from 'immutable'
import { compose, withStateHandlers, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Card from '@mui/material/Card'
import { Helmet } from 'react-helmet'

import recomposeForm from '../../../../oldComponents/recomposeForm'
import FormGroup from '../../../../oldComponents/themedReactToolbox/FormGroup'
import ButtonGroup from '../../../../oldComponents/themedReactToolbox/ButtonGroup'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import SiteSelectField from '../../../../oldComponents/filter/resource/SiteSelectField'
import ConnectedTagInput from '../../../../oldComponents/tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../../../store/TagRedux'

import styles from '../DeviceDetail.css'
import useI18n from '../../../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

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
  injectIntl,
  connect(
    (state, props) => {
      const deviceTags = state.tag.tags.getIn(['device', props.device.get('id')], Immutable.List())

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

      onDiscardClick:
        ($, { device }) =>
        () => ({
          values: initializeValuesFrom(device),
        }),
    }
  ),
  withHandlers({
    onInitialLoad:
      ({ device, fetchTags }) =>
      () => {
        fetchTags(device.get('id'), 'device')
      },

    onSubmit:
      ({ device, updateSingleDevice }) =>
      values =>
        updateSingleDevice({
          deviceId: device.get('id'),
          data: {
            siteId: values.siteId,
          },
        }),

    onDeviceTagChange:
      ({ updateTags }) =>
      (qryId, qryType, tags) => {
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
        valueFromChangeEvent: identity,
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
  const intl = useI18n()
  const deviceName = device.get('name')

  return (
    <div>
      <Helmet title={deviceName} />
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

DeviceDetailEdit.propTypes = {
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
  editable: PropTypes.bool.isRequired,
  deviceTags: PropTypes.oneOfType([PropTypes.object]).isRequired,
  form: PropTypes.oneOfType([PropTypes.object]).isRequired,
  meta: PropTypes.oneOfType([PropTypes.object]).isRequired,
  values: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onSiteIdChange: PropTypes.func.isRequired,
  onDiscardClick: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  onDeviceTagChange: PropTypes.func.isRequired,
}

export default enhance(DeviceDetailEdit)
