import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

import recomposeForm from '../../components/recomposeForm'
import validateEmailAddress from '../../shared/utils/validate'
import DialCodeDropdownInput from '../../filter/hardcoded/DialCodeDropdownInput'
import PartnerSelectField from '../../filter/partner/PartnerSelectField'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import messages from './messages'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export function validate({ name, email, email2 }, { intl }) {
  const errors = {}
  if (!name) {
    errors.name = intl.formatMessage(messages.nameRequired)
  }
  if (
    !validateEmailAddress(email)
      .optional()
      .isValid()
  ) {
    errors.email = intl.formatMessage(messages.invalidEmailAddress)
  }
  if (
    !validateEmailAddress(email2)
      .optional()
      .isValid()
  ) {
    errors.email2 = intl.formatMessage(messages.invalidEmailAddress)
  }
  return errors
}

const DEFAULT_VALUES = {
  name: '',
  title: '',
  email: '',
  email2: '',
  phone: '',
  cell: '',
  lastPartnerId: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  zip: '',
  notes: '',
}

const getInitialValues = contactDetails => ({
  name: contactDetails.get('name') || DEFAULT_VALUES.name,
  title: contactDetails.get('title') || DEFAULT_VALUES.title,
  email: contactDetails.get('email') || DEFAULT_VALUES.email,
  email2: contactDetails.get('email2') || DEFAULT_VALUES.email2,
  phone: contactDetails.get('phone') || DEFAULT_VALUES.phone,
  cell: contactDetails.get('cell') || DEFAULT_VALUES.cell,
  lastPartnerId:
    contactDetails.get('lastPartnerId') || DEFAULT_VALUES.lastPartnerId,
  countryId: contactDetails.get('countryId') || DEFAULT_VALUES.countryId,
  stateId: contactDetails.get('stateId') || DEFAULT_VALUES.stateId,
  lgaId: contactDetails.get('lgaId') || DEFAULT_VALUES.lgaId,
  zip: contactDetails.get('zip') || DEFAULT_VALUES.zip,
  notes: contactDetails.get('notes') || DEFAULT_VALUES.notes,
})

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })

      this.setState({
        onChange,
        values: getInitialValues(this.props.contactDetails),
      })
    },

    componentWillReceiveProps(nextProps) {
      const { contactDetails } = nextProps
      if (this.props.contactDetails !== contactDetails) {
        // Re-initialize
        this.state.onChange(getInitialValues(contactDetails))
      }
    },
  }),
  recomposeForm({
    fields: [
      { fieldName: 'name', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'title', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'email', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'email2', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'phone', valueFromChangeEvent: _.identity },
      { fieldName: 'cell', valueFromChangeEvent: _.identity },
      {
        fieldName: 'lastPartnerId',
        valueFromChangeEvent: _.identity,
      },
      { fieldName: 'countryId', valueFromChangeEvent: _.identity },
      { fieldName: 'stateId', valueFromChangeEvent: _.identity },
      { fieldName: 'lgaId', valueFromChangeEvent: _.identity },
      { fieldName: 'zip', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'notes', valueFromChangeEvent: it => it.target.value },
    ],
    validate,
  }),
  withHandlers({
    onCountryIdChange: ({
      onCountryIdChange,
      onStateIdChange,
      onLgaIdChange,
    }) => countryId => {
      onLgaIdChange(undefined)
      onStateIdChange(undefined)
      onCountryIdChange(countryId)
    },

    onStateIdChange: ({ onStateIdChange, onLgaIdChange }) => stateId => {
      onLgaIdChange(undefined)
      onStateIdChange(stateId)
    },
  })
)

export const ContactDetailsForm = ({
  intl,
  loading,
  userIsAdmin,
  showNotesField,
  // --- injected by recompose ---
  form,
  values,
  meta,
  onNameChange,
  onTitleChange,
  onEmailChange,
  onEmail2Change,
  onPhoneChange,
  onCellChange,
  onLastPartnerIdChange,
  onCountryIdChange,
  onStateIdChange,
  onLgaIdChange,
  onZipChange,
  onNotesChange,
  handleSubmit,
}) => (
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <section>
        <TextField
          fullWidth
          type="text"
          name="name"
          label={intl.formatMessage(messages.fullName)}
          value={values.name}
          onChange={onNameChange}
          disabled={loading}
          error={meta.name.touched && meta.name.error}
          helperText={meta.name.touched && meta.name.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 500 }}
        />
        <TextField
          fullWidth
          type="text"
          name="title"
          label={intl.formatMessage(messages.jobTitle)}
          value={values.title}
          onChange={onTitleChange}
          disabled={loading}
          error={meta.title.touched && meta.title.error}
          helperText={meta.title.touched && meta.title.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 255 }}
        />
      </section>
      <section>
        <h1>{intl.formatMessage(messages.emailHeader)}</h1>
        <TextField
          fullWidth
          type="email"
          name="email"
          label={intl.formatMessage(messages.primaryEmail)}
          value={values.email}
          onChange={onEmailChange}
          disabled={loading}
          error={meta.email.touched && meta.email.error}
          helperText={meta.email.touched && meta.email.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 500 }}
        />
        <TextField
          fullWidth
          type="email"
          name="email2"
          label={intl.formatMessage(messages.secondaryEmail)}
          value={values.email2}
          onChange={onEmail2Change}
          disabled={loading}
          error={meta.email2.touched && meta.email2.error}
          helperText={meta.email2.touched && meta.email2.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 500 }}
        />
      </section>
      <section>
        <h1>{intl.formatMessage(messages.phone)}</h1>
        <DialCodeDropdownInput
          name="phone"
          label={intl.formatMessage(messages.telephone)}
          value={values.phone}
          onChange={onPhoneChange}
          disabled={loading}
          error={meta.phone.touched && meta.phone.error}
          helperText={meta.phone.touched && meta.phone.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 40 }}
        />
        <DialCodeDropdownInput
          name="cell"
          label={intl.formatMessage(messages.mobile)}
          value={values.cell}
          onChange={onCellChange}
          disabled={loading}
          error={meta.cell.touched && meta.cell.error}
          helperText={meta.cell.touched && meta.cell.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 40 }}
        />
      </section>
      {userIsAdmin && (
        <section>
          <h1>{intl.formatMessage(messages.partner)}</h1>
          <PartnerSelectField
            name="lastPartnerId"
            floatingLabelText={intl.formatMessage(messages.partner)}
            emptyId="-1"
            emptyText=""
            partnerId={values.lastPartnerId}
            onChangePartner={onLastPartnerIdChange}
            disabled={loading}
            errorStyle={{
              float: 'left',
              whiteSpace: 'nowrap',
              textOverflow: 'visible',
            }}
            errorText={meta.lastPartnerId.touched && meta.lastPartnerId.error}
            autoWidth
            tabIndex="0"
            aria-haspopup
          />
        </section>
      )}
      <section>
        <h1>{intl.formatMessage(messages.location)}</h1>
        <div className={cssClasses('GeographyDropdownGroup')}>
          <CountrySelectField
            className={cssClasses('GeographyDropdown')}
            allItemText={intl.formatMessage(messages.all)}
            onCountryIdChange={onCountryIdChange}
            countryId={values.countryId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.country)}
          />
          <StateSelectField
            className={cssClasses('GeographyDropdown')}
            allItemText={intl.formatMessage(messages.all)}
            onStateIdChange={onStateIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.state)}
          />
          <LgaSelectField
            className={cssClasses('GeographyDropdown')}
            allItemText={intl.formatMessage(messages.all)}
            onLgaIdChange={onLgaIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            lgaId={values.lgaId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.lga)}
          />
        </div>
        <TextField
          fullWidth
          type="text"
          name="zip"
          label={intl.formatMessage(messages.zip)}
          value={values.zip}
          onChange={onZipChange}
          disabled={loading}
          error={meta.zip.touched && meta.zip.error}
          helperText={meta.zip.touched && meta.zip.error}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 45 }}
        />
      </section>
      {showNotesField && (
        <section>
          <TextField
            fullWidth
            type="text"
            name="notes"
            label={intl.formatMessage(messages.notes)}
            value={values.notes}
            onChange={onNotesChange}
            disabled={loading}
            error={meta.notes.touched && meta.notes.error}
            helperText={meta.notes.touched && meta.notes.error}
            multiline
            rows={4}
            margin="normal"
            FormHelperTextProps={{
              margin: 'dense',
            }}
            inputProps={{ maxLength: 2000 }}
          />
        </section>
      )}
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        color="primary"
        variant="contained"
        disabled={loading || form.pristine || !form.valid || form.submitting}
      >
        {intl.formatMessage(messages.save)}
      </Button>
    </div>
  </form>
)

export default enhance(ContactDetailsForm)
