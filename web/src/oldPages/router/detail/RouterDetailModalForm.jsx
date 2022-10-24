import React from 'react'
import ExitToApp from '@mui/icons-material/ExitToApp'
import { Button, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { compose, setPropTypes, pure } from 'recompose'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import recomposeForm, { errorProps } from '../../../oldComponents/recomposeForm'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import JSONSchemaCard from '../../../oldComponents/shared/JSONSchemaCard'
import { tokens } from '../../../store/DeviceApprovalRedux'
import styles from './RouterDetailModalForm.css'

const cssClasses = classnames.bind(styles)

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
      'shortName',
      'notes',
      {
        fieldName: 'approvalToken',
        valueFromChangeEvent(e, isInputChecked) {
          return isInputChecked ? tokens.APPROVED : tokens.ASSIGNED
        },
      },
      {
        fieldName: 'siteId',
        valueFromChangeEvent: identity,
      },
      {
        fieldName: 'configurationData',
        valueFromChangeEvent: identity,
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
      <Button onClick={props.onCancel} type="button" color="primary" style={{ marginRight: 10 }}>
        {labels.cancel}
      </Button>
    ),
    <Button
      disabled={form.pristine || !form.valid || form.submitting}
      onClick={props.handleSubmit}
      type="button"
      color="secondary"
    >
      {labels.update}
    </Button>,
  ]

  return (
    <AspectDialog
      modal
      autoScrollBodyContent
      actions={actions}
      open={props.isDialogOpen}
      onRequestClose={props.onCancel}
    >
      <form>
        <TextField
          name="Name"
          label={labels.name}
          value={values.name}
          onChange={props.onNameChange}
          fullWidth
          {...errorProps(meta.name)}
          margin="normal"
        />
        <TextField
          name="ShortName"
          label={labels.shortName}
          value={values.shortName}
          onChange={props.onShortNameChange}
          fullWidth
          {...errorProps(meta.shortName)}
          margin="normal"
        />
        <TextField
          name="Notes"
          label={labels.notes}
          value={values.notes}
          onChange={props.onNotesChange}
          fullWidth
          {...errorProps(meta.notes)}
          margin="normal"
        />
        <div className={cssClasses('AutoCompleteField')}>
          <div className={cssClasses('AutoCompleteField__Inner')}>
            <SiteAutoCompleteField
              name="SiteId"
              floatingLabelText={labels.siteId}
              value={values.siteId}
              onChange={props.onSiteIdChange}
              hintText="Enter site name"
              floatingLabelFixed
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
              label={field.label}
              value={field.value}
              onClick={stopEventPropagation}
              onChange={event =>
                props.onConfigurationDataChange(values.configurationData.setIn(field.path, event.target.value))
              }
              fullWidth
              margin="normal"
            />
          )}
          formatNestedSubtitle={props.formatNestedSubtitle}
          dataSchema={props.configurationDataSchema}
          data={values.configurationData}
        />
      </form>
    </AspectDialog>
  )
}

function stopEventPropagation(event) {
  event.stopPropagation()
}

export default enhance(RouterDetailModalForm)
