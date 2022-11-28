import React, { useEffect } from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
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
    >
      {(partnersData || []).map(c => (
        <MenuItem key={c.value} value={c.value}>
          {c.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default PartnerSelect
