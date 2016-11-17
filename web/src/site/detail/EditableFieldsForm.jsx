// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

// Our own imports
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import LocationSelector from '../../components/shared/LocationSelector'

const renderTextField = ({ input, meta, ...restProps }) => (
  <TextField
    {...restProps}
    {...input}
    fullWidth
    errorStyle={{ float: 'left' }}
    errorText={meta.touched && meta.error}
  />
)

// Renders underlying form and inputs components
export class EditableFieldsForm extends PureComponent {

  static propTypes = {
    labels: PropTypes.object.isRequired,
    initialValues: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired
  }

  render() {
    const { labels, initialValues, handleSubmit, pristine, loading, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" floatingLabelText={labels.name} component={renderTextField} />
        <Field name="shortName" floatingLabelText={labels.shortName} component={renderTextField} />
        <TimezoneSelect name="timezone" label={labels.timezone} disabled={loading || submitting} fullWidth />
        <LocationSelector
          loading={loading}
          initialValues={initialValues}
          formName="siteDetail"
          countryIdFieldName="countryId"
          stateIdFieldName="stateId"
          lgaIdFieldName="lgaId"
        />
        <Field name="address" floatingLabelText={labels.address} component={renderTextField} />
        <Field name="address2" floatingLabelText={labels.address2} component={renderTextField} />
        <Field name="city" floatingLabelText={labels.city} component={renderTextField} />
        <Field name="zip" floatingLabelText={labels.zip} component={renderTextField} />
        <RaisedButton disabled={pristine || submitting} type="submit" label="Update" secondary />
        {submitting && <LinearProgress />}
      </form>
    )
  }
}

function validate(values) {
  const errors = {}

  if (!values.get('name')) {
    errors.name = 'Required'
  }
  if (!values.get('shortName')) {
    errors.shortName = 'Required'
  }

  return errors
}

export const EditableFieldsFormContainer = _.flowRight(
  reduxForm({
    form: 'siteDetail',
    validate
  })
)(EditableFieldsForm)
