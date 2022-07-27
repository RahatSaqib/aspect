// Imports from packages
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { compose, setPropTypes, pure, withHandlers } from 'recompose'
import { Field, reduxForm } from 'redux-form/immutable'

import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'

// Material-UI
import LinearProgress from '@material-ui/core/LinearProgress'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

// Our own imports
import { deleteSingleSite } from '../../../../site/SiteRedux'
import TimezoneSelect from '../../../../components/shared/TimezoneSelect'
import LocationSelector from '../../../../components/shared/LocationSelector'
import ConnectedTagInput from '../../../../tag/ConnectedTagInput'
import { ReadOnlyField } from '../../../../components/shared/ReadOnlyFields'
import AspectButton from '../../../../components/shared/AspectButton'
import AspectDialog from '../../../../components/shared/AspectDialog'
import PermissionsProvider from '../../../../Providers/PermissionsProvider'

import messages from '../messages'
import styles from './EditableFieldsForm.css'

const cssClasses = classnames.bind(styles)

function validate(field) {
  const { name, value } = field
  const errors = {}
  if (['shortName', 'name'].includes(name) && isEmpty(value)) {
    errors[name] = `${name} is required`
  }
  return errors
}

const renderTextField = ({ input, meta, ...restProps }) => {
  const errors = validate(input)
  return (
    <TextField
      {...restProps}
      {...input}
      margin="normal"
      fullWidth
      error={!!(meta.touched && !isEmpty(errors[input.name]))}
      helperText={meta.touched && meta.error}
    />
  )
}

const enhance = compose(
  setPropTypes({
    labels: PropTypes.object.isRequired,
    loading: PropTypes.bool,
    updateLatLongFromFormAddress: PropTypes.func.isRequired,
  }),
  pure,
  reduxForm({
    form: 'siteDetail',
    enableReinitialize: true,
    validate,
  }),
  withHandlers({
    onSetBasedAddressClick:
      ({ updateLatLongFromFormAddress }) =>
      () => {
        updateLatLongFromFormAddress()
      },
  }),
  setPropTypes({
    initialValues: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    // onChangeSiteTag: PropTypes.func.isRequired,
    onSetBasedAddressClick: PropTypes.func.isRequired,
  })
)

// Renders underlying form and inputs components
export const EditableFieldsForm = ({
  formatMessage,
  labels,
  loading,
  initialValues,
  handleSubmit,
  pristine,
  submitting,
  siteTags,
  onSiteTagChange,
  onSetBasedAddressClick,
  invalid,
}) => {
  const dispatch = useDispatch()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const navigate = useNavigate()

  const handleDelete = () => {
    dispatch(deleteSingleSite(initialValues.get('id')))
    setShowConfirmation(false)
    navigate(-2)
  }

  function handleDeletePrompt() {
    setShowConfirmation(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={cssClasses('container')}>
        <Field className={cssClasses('container__field')} name="name" label={labels.name} component={renderTextField} />
        <Field
          className={cssClasses('container__field')}
          name="shortName"
          label={labels.shortName}
          component={renderTextField}
        />
        <Field
          className={cssClasses('container__field')}
          name="externalId"
          label={labels.externalId}
          component={renderTextField}
        />
      </div>
      <LocationSelector
        loading={loading}
        initialValues={initialValues}
        formName="siteDetail"
        countryIdFieldName="countryId"
        stateIdFieldName="stateId"
        lgaIdFieldName="lgaId"
        onChangeSelectedState={onSetBasedAddressClick}
      />
      <div className={cssClasses('container')}>
        <Field
          className={cssClasses('container__field')}
          name="address"
          label={labels.address}
          component={renderTextField}
          onBlur={onSetBasedAddressClick}
        />
        <Field
          className={cssClasses('container__field')}
          name="address2"
          label={labels.address2}
          component={renderTextField}
          onBlur={onSetBasedAddressClick}
        />
      </div>
      <div className={cssClasses('container')}>
        <Field
          className={cssClasses('container__field')}
          name="city"
          label={labels.city}
          component={renderTextField}
          onBlur={onSetBasedAddressClick}
        />
        <Field
          className={cssClasses('container__field')}
          name="zip"
          label={labels.zip}
          component={renderTextField}
          onBlur={onSetBasedAddressClick}
        />
      </div>
      <div className={cssClasses('container', 'coordinate')}>
        <Field
          className={cssClasses('container__field')}
          name="longitude"
          label={labels.longitude}
          component={renderTextField}
        />
        <Field
          className={cssClasses('container__field')}
          name="latitude"
          label={labels.latitude}
          component={renderTextField}
        />
        <div className={cssClasses('coordinate__button')}>
          <AspectButton color="primary" variant="contained" onClick={onSetBasedAddressClick}>
            {formatMessage(messages.buttonSetBasedonAddress)}
          </AspectButton>
        </div>
      </div>
      <TimezoneSelect name="timezone" label={labels.timezone} disabled={loading || submitting} fullWidth />
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
            noMatch={labels.noMatch}
          />
        )}
      />
      <Button disabled={invalid || pristine || submitting} type="submit" color="secondary" variant="contained">
        {formatMessage(messages.buttonUpdate)}
      </Button>
      <PermissionsProvider permissions={['site:admin']}>
        <Button
          disabled={!pristine}
          style={{ marginLeft: '1rem', backgroundColor: 'red', color: 'white' }}
          type="button"
          color="error"
          variant="contained"
          onClick={handleDeletePrompt}
        >
          {formatMessage(messages.buttonDelete)}
        </Button>
      </PermissionsProvider>
      {submitting && <LinearProgress />}

      <AspectDialog
        actions={[
          <Button color="primary" onClick={() => setShowConfirmation(false)}>
            {formatMessage(messages.cancel)}
          </Button>,
          <Button color="primary" variant="contained" onClick={() => handleDelete()}>
            {formatMessage(messages.yes)}
          </Button>,
        ]}
        maxWidth="sm"
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <h3>{formatMessage(messages.deleteSiteConfirmationTitle)}</h3>
        <div style={{ marginTop: '15px' }}>{formatMessage(messages.deleteSiteConfirmationMessage)}</div>
      </AspectDialog>
    </form>
  )
}

export const EditableFieldsFormContainer = enhance(EditableFieldsForm)

export default EditableFieldsFormContainer
