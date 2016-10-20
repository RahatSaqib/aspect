// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
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

export class Form extends PureComponent {

  static propTypes = {
    labels: PropTypes.object.isRequired
  }

  render() {
    const { labels, handleSubmit, pristine, submitting } = this.props

    return (
      <form onSubmit={handleSubmit}>
        <Field name="lastTestOn" floatingLabelText={labels.lastTestOn} component={renderTextField} />
        <Field name="patientId" floatingLabelText={labels.patientId} component={renderTextField} />
        <Field name="resultText" multiLine floatingLabelText={labels.resultText} component={renderTextField} />
        <RaisedButton disabled={pristine || submitting} type="submit" label="Update" secondary />
        {submitting && <LinearProgress />}
      </form>
    )
  }
}

function validate(values) {
  const errors = {}

  if (!values.get('lastTestOn')) {
    errors.name = 'Required'
  }
  if (!values.get('patientId')) {
    errors.shortName = 'Required'
  }
  if (!values.get('resultText')) {
    errors.shortName = 'Required'
  }

  return errors
}

export const FormContainer = _.flowRight(
  reduxForm({
    form: 'ResultDetail',
    validate
  })
)(Form)
