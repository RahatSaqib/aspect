import React from 'react'
import PropTypes from 'prop-types'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import classnames from 'classnames/bind'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(require('../popover/FiltersPanel.css'))

const CheckboxField = ({ onChange, name, label, value, style }) => {
  const updateSelection = () => event =>
    onChange(event.target.checked || undefined)
  return (
    <div className={cssClasses('checkbox__container')}>
      <FormGroup className={cssClasses('checkbox__group')}>
        <FormControlLabel
          control={
            <AspectCheckbox
              name={name}
              margin="normal"
              checked={value === 'true'}
              onChange={updateSelection(name)}
            />
          }
          label={label}
        />
      </FormGroup>
    </div>
  )
}

CheckboxField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
}

export default CheckboxField
