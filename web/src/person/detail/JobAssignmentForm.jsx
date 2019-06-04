import _ from 'lodash'
import React, { useState } from 'react'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import Button from '@material-ui/core/Button'
import MenuItem from '@material-ui/core/MenuItem'
import classnames from 'classnames/bind'
import { Link } from 'react-router-dom'
import FaExternalLink from 'react-icons/lib/fa/external-link'
import RemoveIcon from '@material-ui/icons/RemoveCircle'
import LinearProgress from '@material-ui/core/LinearProgress'
import recomposeForm from '../../components/recomposeForm'

import { Unit } from '../../components/pureGrids'
import AspectDialog from '../../components/shared/AspectDialog'

import messages from './messages'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import SiteSelectField from '../../filter/geography/SiteSelectField'
import SelectField from '../../components/shared/SelectField'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

const DEFAULT_VALUES = {
  jobFunctionId: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  siteId: undefined,
}

const validate = ({ jobFunctionId }, { intl }) => {
  const errors = {}
  if (!jobFunctionId) {
    errors.jobFunctionId = intl.formatMessage(messages.nameRequired)
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
        values: { ...DEFAULT_VALUES, countryId: this.props.countryId },
      })
    },
  }),
  recomposeForm({
    fields: [
      { fieldName: 'jobFunctionId', valueFromChangeEvent: _.identity },
      { fieldName: 'countryId', valueFromChangeEvent: _.identity },
      { fieldName: 'stateId', valueFromChangeEvent: _.identity },
      { fieldName: 'lgaId', valueFromChangeEvent: _.identity },
      { fieldName: 'siteId', valueFromChangeEvent: _.identity },
    ],
    validate,
  }),
  withHandlers({
    onStateIdChange: ({ onStateIdChange, values }) => stateId => {
      values.lgaId = undefined
      values.siteId = undefined
      onStateIdChange(stateId)
    },
    onLgaIdChange: ({ onLgaIdChange, values }) => lgaId => {
      values.siteId = undefined
      onLgaIdChange(lgaId)
    },
    onJobFunctionIdChange: ({ onJobFunctionIdChange }) => jobFunctionId => {
      onJobFunctionIdChange(jobFunctionId)
    },
    handleSubmit: ({ handleSubmit, values, form }) => event => {
      handleSubmit(event)
      values.jobFunctionId = undefined
      values.stateId = undefined
      values.lgaId = undefined
      values.siteId = undefined
      form.valid = false
    },
  })
)

export const JobAssignemntForm = ({
  intl,
  loading,
  form,
  values,
  onJobFunctionIdChange,
  onStateIdChange,
  onLgaIdChange,
  onSiteIdChange,
  handleSubmit,
  jobFunctions = [],
  assignments,
  loadedAssignments,
  onDeleteAssignment,
}) => {
  const [confirmation, setConfirmation] = useState({ isActive: false })
  const onCancelConfirmation = () => setConfirmation({ isActive: false })
  const onConfirmRemove = () => {
    setConfirmation({ isActive: false })
    onDeleteAssignment(confirmation.assignment.jobContextId)
  }
  const askConfirmation = (assignment, index) => {
    setConfirmation({ isActive: true, assignment, index })
  }
  const renderAssignment = (assignment, showLinks) => {
    if (!assignment) {
      return null
    }
    return (
      <div className={cssClasses('Assignment__Section')}>
        <div className={cssClasses('Assignment__Title')}>
          {assignment.jobFunctionName}
          {showLinks && (
            <Link
              to="#"
              onClick={() => askConfirmation(assignment)}
              className={cssClasses('Assignment__Link')}
              color="primary"
            >
              <RemoveIcon />
            </Link>
          )}
        </div>
        <div>{assignment.countryName}</div>
        <div>{assignment.stateName || 'All states'}</div>
        <div>{assignment.lgaName || 'All LGAs'}</div>
        <div>
          <span>{assignment.siteName || 'All sites'}</span>
          {showLinks && (
            <Link to="#" className={cssClasses('Assignment__Link')}>
              <FaExternalLink />
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cssClasses('Job__Assignment', 'Form__Content')}>
      <Unit sm="1-2" className={cssClasses('Section__Content')}>
        <form
          onSubmit={handleSubmit}
          className={cssClasses('Assignment__Form')}
        >
          <SelectField
            fullWidth
            hintText={intl.formatMessage(messages.selectJob)}
            value={values.jobFunctionId}
            onChange={({ target: { value } }) => {
              onJobFunctionIdChange(value === 'all' ? undefined : value)
            }}
            floatingLabelFixed
            floatingLabelText={intl.formatMessage(messages.job)}
          >
            {jobFunctions.map(x => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </SelectField>
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
              hintText={intl.formatMessage(messages.all)}
              onStateIdChange={onStateIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              floatingLabelFixed
              floatingLabelText={intl.formatMessage(messages.state)}
            />
            <LgaSelectField
              allItemText={intl.formatMessage(messages.all)}
              hintText={intl.formatMessage(messages.all)}
              onLgaIdChange={onLgaIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              lgaId={values.lgaId}
              floatingLabelFixed
              floatingLabelText={intl.formatMessage(messages.lga)}
            />
            <SiteSelectField
              allItemText={intl.formatMessage(messages.all)}
              hintText={intl.formatMessage(messages.all)}
              onSiteIdChange={onSiteIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              lgaId={values.lgaId}
              siteId={values.siteId}
              floatingLabelFixed
              floatingLabelText={intl.formatMessage(messages.site)}
            />
          </section>
          <div className={cssClasses('Form__ActionRow')}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={
                loading || form.pristine || !form.valid || form.submitting
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
          {!loadedAssignments && <LinearProgress />}
          {assignments.length === 0 && <h4>Not specified</h4>}
          {assignments.map(assignment => renderAssignment(assignment, true))}
        </section>
      </Unit>

      <AspectDialog
        actions={[
          <Button color="primary" onClick={onCancelConfirmation}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
          <Button color="primary" variant="contained" onClick={onConfirmRemove}>
            {intl.formatMessage(messages.yesDelete)}
          </Button>,
        ]}
        maxWidth="sm"
        open={confirmation.isActive}
        onEscapeKeyDown={onCancelConfirmation}
        onClose={onCancelConfirmation}
      >
        <h3>Do you want to remove below assignment?</h3>
        {renderAssignment(confirmation.assignment)}
      </AspectDialog>
    </div>
  )
}

export default enhance(JobAssignemntForm)
