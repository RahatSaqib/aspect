import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import LinearProgress from '@material-ui/core/LinearProgress'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

// Our own imports
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import LocationSelector from '../../components/shared/LocationSelector'
import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'

const renderTextField = ({ input, meta, ...restProps }) => (
  <TextField
    {...restProps}
    {...input}
    margin="normal"
    fullWidth
    errorStyle={{
      float: 'left',
      whiteSpace: 'nowrap',
      textOverflow: 'visible',
    }}
    error={!!(meta.touched && meta.error)}
    helperText={meta.touched && meta.error}
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
    <Field name="name" label={labels.name} component={renderTextField} />
    <Field
      name="shortName"
      label={labels.shortName}
      component={renderTextField}
    />
    <Field
      name="externalId"
      label={labels.externalId}
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
    <Field name="address" label={labels.address} component={renderTextField} />
    <Field
      name="address2"
      label={labels.address2}
      component={renderTextField}
    />
    <Field name="city" label={labels.city} component={renderTextField} />
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
    <Button
      disabled={pristine || submitting}
      type="submit"
      color="secondary"
      variant="contained"
    >
      Update
    </Button>
    {submitting && <LinearProgress />}
  </form>
)

export const EditableFieldsFormContainer = enhance(EditableFieldsForm)

export default EditableFieldsFormContainer
