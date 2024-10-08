import React, { useEffect } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import { useFormikContext } from 'formik'
import usePartners from '../../hooks/partner/usePartners'

const PartnerSelect = ({ id, name, label, value, onChange, error, helperText }) => {
  const { isLoading, data: partnersData } = usePartners()
  const { setFieldValue } = useFormikContext()

  useEffect(() => {
    if (!isLoading && partnersData && partnersData.length === 1) {
      setFieldValue(name, partnersData[0]?.value)
    }
  }, [partnersData, isLoading, setFieldValue, name])

  return isLoading ? (
    <LinearProgress />
  ) : (
    <TextField
      id={id}
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      select
      variant="standard"
      value={value || ''}
      onChange={onChange}
      disabled={(partnersData || []).length === 1}
      SelectProps={{ IconComponent: () => null }}
      InputProps={{
        endAdornment: (
          <IconButton
            sx={{ visibility: value ? 'visible' : 'hidden' }}
            onClick={() => onChange({ target: { name, value: null } })}
            disabled={(partnersData || []).length === 1}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    >
      {(partnersData || [])?.map(c => (
        <MenuItem key={c.value} value={c.value}>
          {c.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default PartnerSelect
