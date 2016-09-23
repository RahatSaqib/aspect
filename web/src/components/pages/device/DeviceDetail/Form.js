// Imports from packages
import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

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

export class Form extends React.PureComponent {
  render() {
    const { labels, handleSubmit, pristine, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" floatingLabelText={labels.name} component={renderTextField} />
        <Field name="shortName" floatingLabelText={labels.shortName} component={renderTextField} />
        <Field name="notes" multiLine floatingLabelText={labels.notes} component={renderTextField} />
        <Field name="site" floatingLabelText={labels.site} component={renderTextField} />
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
  // TODO

  return errors
}

export const FormContainer = reduxForm({
  form: 'deviceDetail',
  validate
})(Form)
