// Imports from packages
import classnames from 'classnames/bind'
import _fp from 'lodash/fp'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, pure, setPropTypes } from 'recompose'
import { Link } from 'react-router'

// Material-UI
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'
import Checkbox from 'material-ui/Checkbox'
import ExitToApp from 'material-ui/svg-icons/action/exit-to-app'
import Dialog from 'material-ui/Dialog'

// Our own imports
import recomposeForm from '../../components/recomposeForm'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import SiteAutoCompleteField from '../../filter/resource/SiteAutoCompleteField'
import { tokens } from '../../deviceStatus/DeviceStatusRedux'
import styles from './DeviceDetailModalForm.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  pure,
  setPropTypes({
    onCancel: PropTypes.func,
    formatNestedSubtitle: PropTypes.func.isRequired,
    configurationDataSchema: PropTypes.object.isRequired,
    isDialogOpen: PropTypes.bool.isRequired,
    values: PropTypes.object.isRequired
  }),
  recomposeForm({
    fields: ['name', 'shortname', 'notes', {
      fieldName: 'statusToken',
      valueFromChangeEvent(e, isInputChecked) {
        return isInputChecked ? tokens.APPROVED : tokens.ASSIGNED
      },
    }, {
      fieldName: 'siteId',
      valueFromChangeEvent: _fp.identity
    }, {
      fieldName: 'configurationData',
      valueFromChangeEvent: _fp.identity
    }],
    validate(values) {
      const errors = {}
      //
      if (!values.name) {
        errors.name = 'Required'
      }
      if (!values.siteId) {
        errors.siteId = 'Required'
      }
      return errors
    }
  })
)

export const DeviceDetailModalForm = (props) => {
  const { form, meta, values, labels } = props

  const actions = [
    props.onCancel && (
      <FlatButton
        onClick={props.onCancel}
        type="button"
        label={labels.cancel}
        primary
        style={{ marginRight: 10 }}
      />
    ),
    <FlatButton
      disabled={form.pristine || !form.valid || form.submitting}
      onClick={props.handleSubmit}
      type="button"
      label={labels.update}
      secondary
    />
  ]

  return (
    <Dialog
      modal
      actions={actions}
      open={props.isDialogOpen}
      onRequestClose={props.onCancel}
      autoScrollBodyContent
    >
      <form>
        <TextField
          name="Name"
          floatingLabelText={labels.name}
          value={values.name}
          onChange={props.onChangeName}
          fullWidth
          errorText={meta.name.touched && meta.name.error}
        />
        <TextField
          name="Shortname"
          floatingLabelText={labels.shortname}
          value={values.shortname}
          onChange={props.onChangeShortname}
          fullWidth
          errorText={meta.shortname.touched && meta.shortname.error}
        />
        <TextField
          name="Notes"
          floatingLabelText={labels.notes}
          value={values.notes}
          onChange={props.onChangeNotes}
          fullWidth
          errorText={meta.notes.touched && meta.notes.error}
        />
        <Checkbox
          name="Status"
          label={labels.statusToken}
          style={{ padding: '10px 0' }}
          checked={values.statusToken === tokens.APPROVED}
          onCheck={props.onChangeStatusToken}
        />
        <div className={cssClasses('AutoCompleteField')}>
          <div className={cssClasses('AutoCompleteField__Inner')}>
            <SiteAutoCompleteField
              className={cssClasses('AutoCompleteField__Inner__AutoComplete')}
              name="SiteId"
              floatingLabelText={labels.siteId}
              value={values.siteId}
              onChangeSiteId={props.onChangeSiteId}
              itemTextGetter={site => site.get('name')}
              hintText="Enter site name"
              fullWidth
              errorText={meta.siteId.touched && meta.siteId.error}
            />
            <Link
              className={cssClasses('AutoCompleteField__Inner__Link')}
              title="Go to site"
              to={`/site/${values.siteId}`}
            >
              <ExitToApp />
            </Link>
          </div>
        </div>
        <JSONSchemaCard
          title={labels.configuration}
          renderField={field => (
            <TextField
              name={field.key}
              floatingLabelText={field.label}
              value={field.value}
              onTouchTap={stopEventPropagation}
              onChange={event => (
                props.onChangeConfigurationData(
                  values.configurationData.setIn(field.path, event.target.value)
                )
              )}
              fullWidth
            />
          )}
          formatNestedSubtitle={props.formatNestedSubtitle}
          dataSchema={props.configurationDataSchema}
          data={values.configurationData}
        />
      </form>
    </Dialog>
  )
}

function stopEventPropagation(event) {
  event.stopPropagation()
}

export const DeviceDetailModalFormContainer = enhance(DeviceDetailModalForm)

export default DeviceDetailModalFormContainer
