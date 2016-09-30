// Imports from packages
import _ from 'lodash'
import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

// Our own imports

const renderTextField = ({ input, meta, ...restProps }) => {
  return (
    <TextField
      {...restProps}
      {...input}
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

// Renders underlying form and inputs components
export class EditableFieldsForm extends React.PureComponent {

  static propTypes = {
    labels: React.PropTypes.object.isRequired
  }

  render() {
    const { labels, handleSubmit, pristine, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" floatingLabelText={labels.name} component={renderTextField} />
        <Field name="shortName" floatingLabelText={labels.shortName} component={renderTextField} />
        <Field name="timezone" floatingLabelText={labels.timezone} component={renderTextField} />
        <Field name="country" floatingLabelText={labels.country} component={renderTextField} />
        <Field name="state" floatingLabelText={labels.state} component={renderTextField} />
        <Field name="lga" floatingLabelText={labels.lga} component={renderTextField} />
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
