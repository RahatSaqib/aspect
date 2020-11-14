import React from 'react'
import FormLabel from '@material-ui/core/FormLabel'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import classnames from 'classnames/bind'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(require('../popover/FiltersPanel.css'))

const ResultOnlyReportableResultsSelectField = ({
  floatingLabelText,
  onOnlyReportableResultsChange,
  value,
}) => {
  const updateSelection = () => event =>
    onOnlyReportableResultsChange(event.target.checked || undefined)
  return (
    <div className={cssClasses('checkbox__container')}>
      <FormLabel component="legend" className={cssClasses('checkbox__label')}>
        {floatingLabelText}
      </FormLabel>
      <FormGroup className={cssClasses('checkbox__group')}>
        <FormControlLabel
          control={
            <AspectCheckbox
              name="onlyReportableResults"
              margin="normal"
              checked={value === 'true'}
              onChange={updateSelection('onlyReportableResults')}
            />
          }
          label="Only Reportable Results"
        />
      </FormGroup>
    </div>
  )
}

export default ResultOnlyReportableResultsSelectField
