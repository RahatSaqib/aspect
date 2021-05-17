import React from 'react'
import PropTypes from 'prop-types'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import classnames from 'classnames/bind'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

const cssClasses = classnames.bind(require('../popover/FiltersPanel.css'))

const OnlyEverTransferredField = ({
  onOnlyEverTransferredChange,
  value,
}) => {
  const updateSelection = () => event =>
    onOnlyEverTransferredChange(event.target.checked || undefined)
  return (
    <div className={cssClasses('checkbox__container')}>
      <FormGroup className={cssClasses('checkbox__group')}>
        <FormControlLabel
          control={
            <AspectCheckbox
              name="onlyEverTransferred"
              margin="normal"
              checked={value === 'true'}
              onChange={updateSelection('onlyEverTransferred')}
            />
          }
          label="Only Results Which Were Ever Transferred"
        />
      </FormGroup>
    </div>
  )
}

OnlyEverTransferredField.propTypes = {
  floatingLabelText: PropTypes.string.isRequired,
  onOnlyEverTransferredChange: PropTypes.func.isRequired,
  value: PropTypes.bool.isRequired,
}

export default OnlyEverTransferredField
