import React from 'react'
import PropTypes from 'prop-types'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import classnames from 'classnames/bind'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(require('../popover/FiltersPanel.css'))

const OnlyTreatmentRequiredField = ({
  onOnlyTreatmentRequiredChange,
  value,
}) => {
  const updateSelection = () => event =>
    onOnlyTreatmentRequiredChange(event.target.checked || undefined)
  return (
    <div className={cssClasses('checkbox__container')}>
      <FormGroup className={cssClasses('checkbox__group')}>
        <FormControlLabel
          control={
            <AspectCheckbox
              name="onlyTreatmentRequired"
              margin="normal"
              checked={value === 'true'}
              onChange={updateSelection('onlyTreatmentRequired')}
            />
          }
          label="Only Results With Treatment Required"
        />
      </FormGroup>
    </div>
  )
}

OnlyTreatmentRequiredField.propTypes = {
  onOnlyTreatmentRequiredChange: PropTypes.func.isRequired,
  value: PropTypes.bool.isRequired,
}

export default OnlyTreatmentRequiredField
