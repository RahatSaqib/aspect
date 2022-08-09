import React from 'react'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import LinearProgress from '@mui/material/LinearProgress'
import useSiteType from '../../../Hooks/site/useSiteType'

const SiteTypeSelect = ({ name, label, value, onChange, width, disabled }) => {
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
          style={{ width: '98%', marginRight: '1%', marginLeft: '1%', marginTop: '16px' }}
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
