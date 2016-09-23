// Imports from packages
import React from 'react'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

const renderNameField = ({ input, meta }) => {
  return (
    <TextField
      {...input}
      floatingLabelText="Name"
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

const renderShortNameField = ({ input, meta }) => {
  return (
    <TextField
      {...input}
      floatingLabelText="Short Name"
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

const renderNotesField = ({ input, meta }) => {
  return (
    <TextField
      {...input}
      floatingLabelText="Notes"
      multiLine
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

const renderSiteField = ({ input, meta }) => {
  return (
    <TextField
      {...input}
      floatingLabelText="Site (ddl)"
      fullWidth
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
    />
  )
}

export class Form extends React.PureComponent {
  render() {
    const { handleSubmit, pristine, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="name" component={renderNameField} />
        <Field name="shortName" component={renderShortNameField} />
        <Field name="notes" component={renderNotesField} />
        <Field name="site" component={renderSiteField} />
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
