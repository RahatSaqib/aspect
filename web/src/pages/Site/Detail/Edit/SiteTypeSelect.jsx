import React from 'react'
import { LinearProgress, MenuItem, TextField } from '@mui/material'
import useSiteType from '../../../../hooks/site/useSiteType'

const SiteTypeSelect = ({ name, label, value, onChange, width, disabled, style }) => {
  const { isLoading: isSiteTypeLoading, data: siteType } = useSiteType()

  return (
    <span style={{ width }}>
      {isSiteTypeLoading ? (
        <LinearProgress />
      ) : (
        <TextField
          select
          disabled={disabled}
          name={name}
          label={label}
          fullWidth
          variant="standard"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={style}
        >
          {(siteType || []).map(site => (
            <MenuItem key={site.id} value={site.id}>
              {site.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </span>
  )
}

export default SiteTypeSelect
