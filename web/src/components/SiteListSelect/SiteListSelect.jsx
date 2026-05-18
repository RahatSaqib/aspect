import React, { useMemo } from 'react'
import ClearIcon from '@mui/icons-material/Clear'
import { LinearProgress, MenuItem, TextField, IconButton } from '@mui/material'
import useSiteList from '../../hooks/site/useSiteList'

const SiteListSelect = ({ name, label, value, onChange, width, disabled, queryParams, isClearable, className }) => {
  const { isLoading: isSiteListLoading, data: siteList } = useSiteList(queryParams)
  const inputProps = useMemo(() => {
    let iProps = {}
    if (isClearable) {
      iProps = {
        ...iProps,
        endAdornment: (
          <IconButton
            sx={{
              visibility: value ? 'visible' : 'hidden',
              right: '16px',
              position: 'absolute',
              color: '#aaa',
            }}
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            <ClearIcon />
          </IconButton>
        ),
      }
    }
    return iProps
  }, [disabled, isClearable, onChange, value])

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
          className={className}
          variant="standard"
          value={value}
          onChange={e => onChange(e.target.value)}
          InputProps={inputProps}
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
