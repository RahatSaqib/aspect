import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import useLgaByState from '../../hooks/geography/useLgaByState'

const LgaSelectField = ({ allItemText, lgaId, stateId, onLgaIdChange, floatingLabelText, error, helperText }) => {
  const { isLoading: isLgaLoading, data: lgas } = useLgaByState({ stateId }, { enabled: !!stateId })

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
      error={error}
      helperText={error ? helperText : null}
      disabled={!stateId}
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
  lgaId: PropTypes.number,
  stateId: PropTypes.number,
  floatingLabelText: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  error: PropTypes.bool,
}

LgaSelectField.defaultProps = {
  allItemText: null,
  onLgaIdChange: () => {},
  lgaId: null,
  stateId: null,
  helperText: undefined,
  error: undefined,
}
