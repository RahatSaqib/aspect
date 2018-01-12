import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Link } from 'react-router-dom'

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

const cssClasses = classnames.bind(require('./RouterDetailModalForm.css'))

const enhance = compose(
  pure,
  setPropTypes({
    onCancel: PropTypes.func,
    formatNestedSubtitle: PropTypes.func.isRequired,
    configurationDataSchema: PropTypes.object.isRequired,
    isDialogOpen: PropTypes.bool.isRequired,
    values: PropTypes.object.isRequired,
  }),
  recomposeForm({
    fields: [
      'name',
      'shortname',
      'notes',
      {
        fieldName: 'statusToken',
        valueFromChangeEvent(e, isInputChecked) {
          return isInputChecked ? tokens.APPROVED : tokens.ASSIGNED
        },
      },
      {
        fieldName: 'siteId',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'configurationData',
        valueFromChangeEvent: _.identity,
      },
    ],
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
    },
  })
)

export const RouterDetailModalForm = props => {
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
    />,
  ]

  return (
    <Dialog
      modal
      actions={actions}
      open={props.isDialogOpen}
      onRequestClose={props.onCancel}
    >
      <form>
        <TextField
          name="Name"
          floatingLabelText={labels.name}
          value={values.name}
          onChange={props.onNameChange}
          fullWidth
          errorText={meta.name.touched && meta.name.error}
        />
        <TextField
          name="Shortname"
          floatingLabelText={labels.shortname}
          value={values.shortname}
          onChange={props.onShortnameChange}
          fullWidth
          errorText={meta.shortname.touched && meta.shortname.error}
        />
        <TextField
          name="Notes"
          floatingLabelText={labels.notes}
          value={values.notes}
          onChange={props.onNotesChange}
          fullWidth
          errorText={meta.notes.touched && meta.notes.error}
        />
        <Checkbox
          name="Status"
          label={labels.statusToken}
          style={{ padding: '10px 0' }}
          checked={values.statusToken === tokens.APPROVED}
          onCheck={props.onStatusTokenChange}
        />
        <div className={cssClasses('AutoCompleteField')}>
          <div className={cssClasses('AutoCompleteField__Inner')}>
            <SiteAutoCompleteField
              className={cssClasses('AutoCompleteField__Inner__AutoComplete')}
              name="SiteId"
              floatingLabelText={labels.siteId}
              value={values.siteId}
              onSiteIdChange={props.onSiteIdChange}
              hintText="Enter site name"
              fullWidth
              errorText={meta.siteId.touched && meta.siteId.error}
            />
            <Link
              className={cssClasses('AutoCompleteField__Inner__Link')}
              title="Go to site"
              to={`/browse/site/${values.siteId}`}
            >
              <ExitToApp />
            </Link>
          </div>
        </div>
        <JSONSchemaCard
          initiallyExpanded
          title={labels.configuration}
          renderField={field => (
            <TextField
              name={field.key}
              floatingLabelText={field.label}
              value={field.value}
              onTouchTap={stopEventPropagation}
              onChange={event =>
                props.onConfigurationDataChange(
                  values.configurationData.setIn(field.path, event.target.value)
                )
              }
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

export default enhance(RouterDetailModalForm)
