import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

// Our own imports
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import LocationSelector from '../../components/shared/LocationSelector'
import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'

const renderTextField = ({ input, meta, ...restProps }) => (
  <TextField
    {...restProps}
    {...input}
    fullWidth
    errorStyle={{
      float: 'left',
      whiteSpace: 'nowrap',
      textOverflow: 'visible',
    }}
    errorText={meta.touched && meta.error}
  />
)

function validate(values) {
  const errors = {}
  if (values) {
    if (!values.get('name')) {
      errors.name = 'Required'
    }
    if (!values.get('shortName')) {
      errors.shortName = 'Required'
    }
  }
  return errors
}

const enhance = compose(
  setPropTypes({
    labels: PropTypes.object.isRequired,
    loading: PropTypes.bool,
  }),
  pure,
  reduxForm({
    form: 'siteDetail',
    validate,
  }),
  setPropTypes({
    initialValues: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    onChangeSiteTag: PropTypes.func.isRequired,
  })
)

// Renders underlying form and inputs components
export const EditableFieldsForm = ({
  labels,
  loading,
  initialValues,
  handleSubmit,
  pristine,
  submitting,
  siteTags,
  onSiteTagChange,
}) => (
  <form onSubmit={handleSubmit}>
    <Field
      name="name"
      floatingLabelText={labels.name}
      component={renderTextField}
    />
    <Field
      name="shortName"
      floatingLabelText={labels.shortName}
      component={renderTextField}
    />
    <Field
      name="externalId"
      floatingLabelText={labels.externalId}
      component={renderTextField}
    />
    <TimezoneSelect
      name="timezone"
      label={labels.timezone}
      disabled={loading || submitting}
      fullWidth
    />
    <LocationSelector
      loading={loading}
      initialValues={initialValues}
      formName="siteDetail"
      countryIdFieldName="countryId"
      stateIdFieldName="stateId"
      lgaIdFieldName="lgaId"
    />
    <Field
      name="address"
      floatingLabelText={labels.address}
      component={renderTextField}
    />
    <Field
      name="address2"
      floatingLabelText={labels.address2}
      component={renderTextField}
    />
    <Field
      name="city"
      floatingLabelText={labels.city}
      component={renderTextField}
    />
    <Field
      name="zip"
      floatingLabelText={labels.zip}
      component={renderTextField}
    />
    <ReadOnlyField
      label={labels.tags}
      value={siteTags}
      format={v => (
        <ConnectedTagInput
          qryId={initialValues.get('id')}
          qryType="site"
          allowCreate
          onTagChange={onSiteTagChange}
          value={v}
        />
      )}
    />
    <RaisedButton
      disabled={pristine || submitting}
      type="submit"
      label="Update"
      secondary
    />
    {submitting && <LinearProgress />}
  </form>
)

export const EditableFieldsFormContainer = enhance(EditableFieldsForm)

export default EditableFieldsFormContainer
