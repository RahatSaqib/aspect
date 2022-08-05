import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import LinearProgress from '@material-ui/core/LinearProgress'
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
          {(siteType || []).map(zone => (
            <MenuItem key={zone.id} value={zone.id}>
              {zone.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </span>
  )
}

export default SiteTypeSelect
