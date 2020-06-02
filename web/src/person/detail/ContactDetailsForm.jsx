import { connect } from 'react-redux'
import Immutable from 'immutable'
import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

import recomposeForm from '../../components/recomposeForm'
import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import validateEmailAddress from '../../shared/utils/validate'
import DialCodeDropdownInput from '../../filter/hardcoded/DialCodeDropdownInput'
import PartnerSelectField from '../../filter/partner/PartnerSelectField'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import FlagIcon from '../../components/shared/flagIcon/FlagIcon'
import { timezones, languages } from '../../filter/hardcoded'
import messages from './messages'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export function validate({ name, email, email2, countryId }, { intl }) {
  const errors = {}
  if (!name) {
    errors.name = intl.formatMessage(messages.nameRequired)
  }
  if (!countryId) {
    errors.countryId = intl.formatMessage(messages.countryRequired)
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
  canLogIn: false,
  timezone: '',
  culture: '',
}

const getInitialValues = (
  contactDetails,
  partnerList,
  countries,
  userPreferences
) => ({
  name: contactDetails.get('name') || DEFAULT_VALUES.name,
  title: contactDetails.get('title') || DEFAULT_VALUES.title,
  email: contactDetails.get('email') || DEFAULT_VALUES.email,
  email2: contactDetails.get('email2') || DEFAULT_VALUES.email2,
  phone: contactDetails.get('phone') || DEFAULT_VALUES.phone,
  cell: contactDetails.get('cell') || DEFAULT_VALUES.cell,
  lastPartnerId:
    contactDetails.get('lastPartnerId') ||
    (partnerList && partnerList.length === 1
      ? partnerList[0].value
      : DEFAULT_VALUES.lastPartnerId),
  countryId:
    contactDetails.get('countryId') ||
    (countries && countries.items.size === 1
      ? countries.items.first().get('id')
      : DEFAULT_VALUES.countryId),
  stateId: contactDetails.get('stateId') || DEFAULT_VALUES.stateId,
  lgaId: contactDetails.get('lgaId') || DEFAULT_VALUES.lgaId,
  zip: contactDetails.get('zip') || DEFAULT_VALUES.zip,
  notes: contactDetails.get('notes') || DEFAULT_VALUES.notes,
  canLogIn: !!contactDetails.get('canLogIn') || DEFAULT_VALUES.canLogIn,
  userId: contactDetails.get('userId') || undefined,
  timezone:
    (userPreferences && userPreferences.get('timezone')) ||
    DEFAULT_VALUES.timezone,
  culture:
    (userPreferences && userPreferences.get('culture')) ||
    DEFAULT_VALUES.culture,
})

const enhance = compose(
  pure,
  connect(
    (state, props) => {
      const personId = props.contactDetails.get('id')
      const isNew = !personId
      const personTags = state.tag.tags.getIn(
        ['person', personId],
        Immutable.List()
      )

      const countries = state.geography.countriesForLocationSelector

      const partnerList = state.jobs.partnersAndJobFunctionsForSelectList.partners
        // Filter out empty items if props.emptyText is an empty string
        .filter(item => (props.emptyText ? true : item.get('id')))
        .map(item => ({
          value: item.get('id') || props.emptyId,
          text: item.get('name') || props.emptyText,
        }))
        .toJS()

      const countryLabels = state.user.countrySettings.get('countryLabels')

      return {
        personTags,
        isNew,
        partnerList,
        countries,
        countryLabels,
      }
    },
    {
      fetchTags,
      updateTags,
    }
  ),
  withHandlers({
    onLoadTags: ({ contactDetails, fetchTags }) => () => {
      if (contactDetails.get('id')) {
        fetchTags(contactDetails.get('id'), 'person')
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      const {
        partnerList,
        countries,
        contactDetails,
        userPreferences,
      } = this.props

      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: getInitialValues(
          contactDetails,
          partnerList,
          countries,
          userPreferences
        ),
      })
    },

    componentDidMount() {
      this.props.onLoadTags()
    },

    componentDidUpdate(prevProps) {
      const {
        contactDetails,
        partnerList,
        countries,
        userPreferences,
      } = this.props
      if (
        prevProps.contactDetails !== contactDetails ||
        prevProps.partnerList.length !== partnerList.length ||
        prevProps.userPreferences !== userPreferences
      ) {
        this.props.onLoadTags()
        this.state.onChange(
          getInitialValues(
            contactDetails,
            partnerList,
            countries,
            userPreferences
          )
        )
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
      {
        fieldName: 'canLogIn',
        valueFromChangeEvent: it => it.target.checked,
      },
      {
        fieldName: 'timezone',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'culture',
        valueFromChangeEvent: it => it.target.value,
      },
    ],
    validate,
  }),
  withHandlers({
    onEmailBlur: ({ onEmailBlur }) => event => {
      if (event.target.value !== '') onEmailBlur(event.target.value)
    },
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
    onUserCanLogInChange: ({ isUserChange, onCanLogInChange }) => event => {
      onCanLogInChange(event)
      isUserChange(event.target.checked)
    },
    onPersonTagsChange: ({ updateTags }) => (qryId, qryType, tags) => {
      updateTags(qryId, qryType, tags.join(','))
    },
  })
)

export const ContactDetailsForm = ({
  intl,
  loading,
  userIsAdmin,
  showNotesField,
  onEmailBlur,
  canModify = true,
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
  onUserCanLogInChange,
  onCountryIdChange,
  onStateIdChange,
  onLgaIdChange,
  onZipChange,
  onNotesChange,
  onTimezoneChange,
  onCultureChange,
  handleSubmit,
  contactDetails,
  personTags,
  onPersonTagsChange,
  countryLabels,
  isNew,
}) => (
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      {!isNew && canModify && (
        <div style={{ marginBottom: 20 }}>
          <AspectCheckbox
            name="canLogIn"
            margin="normal"
            checked={values.canLogIn}
            onChange={onUserCanLogInChange}
            // disabled={isNew}
          />{' '}
          This contact can log in as a user
        </div>
      )}
      <section className={cssClasses('NameField')}>
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
        <div className={cssClasses('Form__Content__Arrange-field')}>
          <TextField
            fullWidth
            type="email"
            name="email"
            label={intl.formatMessage(messages.primaryEmail)}
            value={values.email}
            onChange={onEmailChange}
            onBlur={onEmailBlur}
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
        </div>
      </section>
      <section>
        <h1>{intl.formatMessage(messages.phone)}</h1>
        <div className={cssClasses('Form__Content__Arrange-field', '')}>
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
        </div>
      </section>

      <section>
        <h1>{intl.formatMessage(messages.location)}</h1>
        <div className={cssClasses('GeographyDropdownGroup')}>
          <CountrySelectField
            className={cssClasses('GeographyDropdown')}
            allItemText=""
            onCountryIdChange={onCountryIdChange}
            countryId={values.countryId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.country)}
          />
          <StateSelectField
            className={cssClasses('GeographyDropdown')}
            allItemText=""
            onStateIdChange={onStateIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            floatingLabelFixed
            floatingLabelText={countryLabels.stateLabel}
          />
          <LgaSelectField
            className={cssClasses('GeographyDropdown')}
            allItemText={intl.formatMessage(messages.all)}
            onLgaIdChange={onLgaIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            lgaId={values.lgaId}
            floatingLabelFixed
            floatingLabelText={countryLabels.lgaLabel}
          />
        </div>
        <TextField
          fullWidth
          type="text"
          name="zip"
          className={cssClasses('ZipCodeField')}
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
      {userIsAdmin && (
        <section>
          <h1>{intl.formatMessage(messages.partner)}</h1>
          <PartnerSelectField
            name="lastPartnerId"
            floatingLabelText={intl.formatMessage(messages.partner)}
            emptyId="-1"
            emptyText=""
            className={cssClasses('PartnerDropDown')}
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
        <TextField
          select
          fullWidth
          id="timezone"
          name="timezone"
          className={cssClasses('TimezoneField')}
          label={intl.formatMessage(messages.timezone)}
          disabled={loading || form.submitting}
          onChange={onTimezoneChange}
          value={values.timezone}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        >
          {timezones.map(item => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          id="culture"
          name="culture"
          className={cssClasses('CultureField')}
          label={intl.formatMessage(messages.language)}
          disabled={loading || form.submitting}
          onChange={onCultureChange}
          value={values.culture}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        >
          {languages.map(item => (
            <MenuItem key={item.culture} value={item.culture}>
              <span>
                <FlagIcon
                  withRightMargin
                  countryIsoAlpha2Code={item.isoAlpha2Code}
                />
                {item.languageName}
              </span>
            </MenuItem>
          ))}
        </TextField>
      </section>
      <section className={cssClasses('TagLabel')}>
        <p>{intl.formatMessage(messages.tags)}</p>
        <ConnectedTagInput
          allowCreate
          label={intl.formatMessage(messages.chooseTags)}
          onTagChange={onPersonTagsChange}
          qryId={contactDetails.get('id')}
          qryType="person"
          value={personTags.toJS()}
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
        {intl.formatMessage(isNew ? messages.create : messages.save)}
      </Button>
    </div>
  </form>
)

export default enhance(ContactDetailsForm)
