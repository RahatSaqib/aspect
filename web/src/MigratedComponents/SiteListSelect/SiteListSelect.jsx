import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import LinearProgress from '@material-ui/core/LinearProgress'
import useSiteList from '../../Hooks/site/useSiteList'

const SiteListSelect = ({ name, label, value, onChange, width, disabled }) => {
  const { isLoading: isSiteListLoading, data: siteList } = useSiteList()

  return (
    <span style={{ width }}>
      {isSiteListLoading ? (
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
          {(siteList || []).map(site => (
            <MenuItem key={site.id} value={site.id}>
              {site.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </span>
  )
}

export default SiteListSelect
