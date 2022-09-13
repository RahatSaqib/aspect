import React from 'react'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import { connect } from 'react-redux'
import { compose, lifecycle, withHandlers, pure } from 'recompose'
import useI18n from '../../../hooks/useI18n'
import CountrySelectField from '../../../oldComponents/filter/geography/CountrySelectField'
import LgaSelectField from '../../../oldComponents/filter/geography/LgaSelectField'
import StateSelectField from '../../../oldComponents/filter/geography/StateSelectField'
import AssaySelectField from '../../../oldComponents/filter/resource/AssaySelectField'
import AssayTypeSelectField from '../../../oldComponents/filter/resource/AssayTypeSelectField'
import DeviceTypeSelectField from '../../../oldComponents/filter/resource/DeviceTypeSelectField'
import DiseaseSelectField from '../../../oldComponents/filter/resource/DiseaseSelectField'
import SiteSelectField from '../../../oldComponents/filter/resource/SiteSelectField'
import { Unit } from '../../../oldComponents/pureGrids'
import recomposeForm from '../../../oldComponents/recomposeForm'
import SelectField from '../../../oldComponents/shared/SelectField'
import { getCustomMessage } from '../../../utils/utils/customMessages'
import messages from './messages'
import PersonAssignments from './PersonAssignments'
import styles from './PersonDetail.css'

const cssClasses = classnames.bind(styles)

const DEFAULT_VALUES = {
  jobFunctionId: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  siteId: undefined,
  diseaseId: undefined,
  deviceTypeId: undefined,
  assayTypeId: undefined,
  assayId: undefined,
}

const validate = ({ jobFunctionId }, { intl }) => {
  const errors = {}
  if (!jobFunctionId) {
    errors.jobFunctionId = intl.formatMessage(messages.jobRequired)
  }
  return errors
}
const enhance = compose(
  connect(state => ({
    user: state.user,
  })),
  pure,
  lifecycle({
    UNSAFE_componentWillMount() {
      const onChange = values => this.setState({ values })
      this.setState({
        onChange,
        values: { ...DEFAULT_VALUES, countryId: this.props.countryId },
      })
    },
  }),
  recomposeForm({
    fields: [
      { fieldName: 'jobFunctionId', valueFromChangeEvent: identity },
      { fieldName: 'countryId', valueFromChangeEvent: identity },
      { fieldName: 'stateId', valueFromChangeEvent: identity },
      { fieldName: 'lgaId', valueFromChangeEvent: identity },
      { fieldName: 'siteId', valueFromChangeEvent: identity },
      { fieldName: 'diseaseId', valueFromChangeEvent: identity },
      { fieldName: 'deviceTypeId', valueFromChangeEvent: identity },
      { fieldName: 'assayTypeId', valueFromChangeEvent: identity },
      { fieldName: 'assayId', valueFromChangeEvent: identity },
    ],
    validate,
  }),
  withHandlers({
    onStateIdChange:
      ({ onStateIdChange, values }) =>
      stateId => {
        values.lgaId = undefined
        values.siteId = undefined
        onStateIdChange(stateId)
      },
    onLgaIdChange:
      ({ onLgaIdChange, values }) =>
      lgaId => {
        values.siteId = undefined
        onLgaIdChange(lgaId)
      },
    onJobFunctionIdChange:
      ({ onJobFunctionIdChange }) =>
      jobFunctionId => {
        onJobFunctionIdChange(jobFunctionId)
      },
    handleSubmit:
      ({ handleSubmit, values, form }) =>
      event => {
        handleSubmit(event)
        values.jobFunctionId = undefined
        values.stateId = undefined
        values.lgaId = undefined
        values.siteId = undefined
        values.diseaseId = undefined
        values.deviceTypeId = undefined
        values.assayTypeId = undefined
        values.assayId = undefined
        form.valid = false
      },
  })
)

export const JobAssignmentForm = ({
  loading,
  form,
  meta,
  values,
  onJobFunctionIdChange,
  onStateIdChange,
  onLgaIdChange,
  onSiteIdChange,
  onDiseaseIdChange,
  onDeviceTypeIdChange,
  onAssayTypeIdChange,
  onAssayIdChange,
  handleSubmit,
  jobFunctions = [],
  assignments,
  loadedAssignments,
  onDeleteAssignment,
  user,
}) => {
  const { formatMessage } = useI18n()
  const baseProps = {
    allItemText: formatMessage(messages.all),
    disabled: form.submitting,
    floatingLabelFixed: true,
    fullWidth: true,
    hintText: formatMessage(messages.all),
  }
  return (
    <div className={cssClasses('Job__Assignment', 'Form__Content')}>
      <Unit sm="1-2" className={cssClasses('Section__Content')}>
        <form onSubmit={handleSubmit} className={cssClasses('Assignment__Form')}>
          <SelectField
            fullWidth
            hintText={formatMessage(messages.selectJob)}
            value={values.jobFunctionId}
            onChange={({ target: { value } }) => {
              onJobFunctionIdChange(value === 'all' ? undefined : value)
            }}
            floatingLabelFixed
            floatingLabelText={formatMessage(messages.job)}
            errorStyle={{
              float: 'left',
              whiteSpace: 'nowrap',
              textOverflow: 'visible',
            }}
            errorText={meta.jobFunctionId.touched && meta.jobFunctionId.error}
          >
            {jobFunctions.map(x => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </SelectField>
          <section>
            <h1>{formatMessage(messages.assignmentDetails)}</h1>
            <CountrySelectField
              disabled
              allItemText={formatMessage(messages.all)}
              countryId={values.countryId}
              floatingLabelFixed
              floatingLabelText={formatMessage(messages.country)}
            />
            <StateSelectField
              {...baseProps}
              onStateIdChange={onStateIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              floatingLabelText={getCustomMessage(messages, 'state', user)}
            />
            <LgaSelectField
              {...baseProps}
              onLgaIdChange={onLgaIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              lgaId={values.lgaId}
              floatingLabelText={getCustomMessage(messages, 'lga', user)}
            />
            <SiteSelectField
              {...baseProps}
              floatingLabelText={formatMessage(messages.site)}
              value={values.siteId}
              onSiteChange={onSiteIdChange}
              countryId={values.countryId}
              stateId={values.stateId}
              lgaId={values.lgaId}
            />
            <DiseaseSelectField
              {...baseProps}
              floatingLabelText={formatMessage(messages.disease)}
              value={values.diseaseId}
              onDiseaseIdChange={onDiseaseIdChange}
            />
            <DeviceTypeSelectField
              {...baseProps}
              floatingLabelText={formatMessage(messages.deviceType)}
              value={values.deviceTypeId}
              onDeviceTypeChange={onDeviceTypeIdChange}
            />
            <AssayTypeSelectField
              {...baseProps}
              floatingLabelText={formatMessage(messages.assayType)}
              value={values.assayTypeId}
              diseaseId={values.diseaseId}
              onAssayTypeIdChange={onAssayTypeIdChange}
            />
            <AssaySelectField
              {...baseProps}
              floatingLabelText={formatMessage(messages.assay)}
              diseaseId={values.diseaseId}
              assayTypeId={values.assayTypeId}
              value={values.assayId}
              onAssayChange={onAssayIdChange}
            />
          </section>
          <div className={cssClasses('Form__ActionRow')}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={loading || form.pristine || !form.valid || form.submitting}
            >
              {formatMessage(messages.save)}
            </Button>
          </div>
        </form>
      </Unit>
      <Unit sm="1-2" className={cssClasses('Section__Content')}>
        <PersonAssignments
          assignments={assignments}
          loadedAssignments={loadedAssignments}
          onDeleteAssignment={onDeleteAssignment}
        />
      </Unit>
    </div>
  )
}

export default enhance(JobAssignmentForm)
