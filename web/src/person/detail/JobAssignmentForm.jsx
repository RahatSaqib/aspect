import _ from 'lodash'
import React from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import MenuItem from '@material-ui/core/MenuItem'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import CloseIcon from '@material-ui/icons/Close'
import recomposeForm from '../../components/recomposeForm'

import { Unit } from '../../components/pureGrids'

import messages from './messages'
import PartnerSelectField from '../../filter/partner/PartnerSelectField'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

const assignments = [
  {
    job: 'Regional Officer',
    country: 'United States',
    state: 'Boston',
    lga: 'LGA 1',
    site: 'site 1',
  },
  {
    job: 'Lab User',
    country: 'United States',
    state: 'Chicago',
    lga: 'LGA 2',
    site: 'site 2',
  },
]

const values = {
  job: '',
  countryId: 2,
  stateId: undefined,
  lgaId: undefined,
}
// const onChange = ()=>{}
const validate = ({ job }, { intl }) => {
  const errors = {}
  if (!job) {
    errors.job = intl.formatMessage(messages.nameRequired)
  }
  return errors
}
const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: { ...values, countryId: this.props.countryId },
      })
    },
  }),
  recomposeForm({
    fields: [
      { fieldName: 'job', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'countryId', valueFromChangeEvent: _.identity },
      { fieldName: 'stateId', valueFromChangeEvent: _.identity },
      { fieldName: 'lgaId', valueFromChangeEvent: _.identity },
    ],
    validate,
  }),
  withHandlers({
    // onCountryIdChange: ({
    //   onCountryIdChange,
    //   onStateIdChange,
    //   onLgaIdChange,
    // }) => countryId => {
    //   onLgaIdChange(undefined)
    //   onStateIdChange(undefined)
    //   onCountryIdChange(countryId)
    // },
    onStateIdChange: ({ onStateIdChange, onLgaIdChange }) => stateId => {
      onLgaIdChange(undefined)
      onStateIdChange(stateId)
    },
  })
)

export const JobAssignemntForm = ({
  intl,
  loading,
  form,
  values,
  meta,
  onStateIdChange,
  onLgaIdChange,
  handleSubmit,
}) => (
  <div className={cssClasses('Job__Assignment', 'Form__Content')}>
    <Unit sm="1-2" className={cssClasses('Section__Content')}>
      <form onSubmit={handleSubmit} className={cssClasses('Assignment__Form')}>
        <TextField
          select
          fullWidth
          id="culture"
          name="culture"
          label={intl.formatMessage(messages.job)}
          onChange={() => console.log('changed')}
          value={assignments}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        >
          {assignments.map(item => (
            <MenuItem key={item.job} value={item.job} />
          ))}
        </TextField>
        <section>
          <h1>{intl.formatMessage(messages.assignmentDetails)}</h1>
          <CountrySelectField
            disabled
            allItemText={intl.formatMessage(messages.all)}
            countryId={values.countryId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.country)}
          />
          <StateSelectField
            allItemText={intl.formatMessage(messages.all)}
            onStateIdChange={onStateIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.state)}
          />
          <LgaSelectField
            allItemText={intl.formatMessage(messages.all)}
            onLgaIdChange={onLgaIdChange}
            countryId={values.countryId}
            stateId={values.stateId}
            lgaId={values.lgaId}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.lga)}
          />
        </section>
        <div className={cssClasses('Form__ActionRow')}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={
              false
              // loading || form.pristine  || form.submitting
            }
          >
            {intl.formatMessage(messages.save)}
          </Button>
        </div>
      </form>
    </Unit>
    <Unit sm="1-2" className={cssClasses('Section__Content')}>
      <section className={cssClasses('Assignments')}>
        <h1>{intl.formatMessage(messages.assignments)}</h1>
        {assignments.map(assignment => (
          <div className={cssClasses('Assignment__Section')}>
            <div className={cssClasses('Assignment__Title')}>
              {assignment.job} <CloseIcon />
            </div>
            <div>{assignment.country}</div>
            <div>{assignment.state} </div>
            <div>{assignment.lga}</div>
            <div>
              <span>{assignment.site}</span>
              <Link to="#" className={cssClasses('Assignment__Link')}>
                <FaExternalLink />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </Unit>
  </div>
)

export default enhance(JobAssignemntForm)
