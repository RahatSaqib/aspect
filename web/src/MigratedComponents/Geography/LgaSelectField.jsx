import PropTypes from 'prop-types'
import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import useLgaByState from '../../Hooks/geography/useLgaByState'

const LgaSelectField = ({ allItemText, lgaId, stateId, onLgaIdChange, floatingLabelText }) => {
  const { isLoading: isLgaLoading, data: lgas } = useLgaByState(stateId, { enabled: !!stateId })

  const handleSelectFieldChange = ({ target: { value } }) => {
    onLgaIdChange(value === 'all' ? undefined : { id: value, name: lgas.find(s => s.id === value).name })
  }

  return isLgaLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      select
      label={floatingLabelText}
      variant="standard"
      value={lgaId}
      onChange={handleSelectFieldChange}
      style={{ width: '98%', margin: '0 1%' }}
    >
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {(lgas || []).map(c => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default LgaSelectField

LgaSelectField.propTypes = {
  allItemText: PropTypes.string,
  onLgaIdChange: PropTypes.func,
  lgaId: PropTypes.string,
  stateId: PropTypes.string,
  floatingLabelText: PropTypes.string.isRequired,
}

LgaSelectField.defaultProps = {
  allItemText: null,
  onLgaIdChange: () => {},
  lgaId: '',
  stateId: '',
}
