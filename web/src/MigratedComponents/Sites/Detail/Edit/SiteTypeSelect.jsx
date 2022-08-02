import React from 'react'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import LinearProgress from '@material-ui/core/LinearProgress'
// import useSiteType from '../../../../Hooks/site/useSiteType'

const SiteTypeSelect = ({ name, label, value, onChange, width, disabled }) => {
  // const { isLoading: isSiteTypeLoading, data: siteType } = useSiteType()
  const isSiteTypeLoading = false
  const siteType = [
    { id: '1', name: 'Clinic' },
    { id: '2', name: 'Lab' },
    { id: '3', name: 'Wharehouse' },
  ]

  return isSiteTypeLoading ? (
    <LinearProgress />
  ) : (
    <span style={{ width }}>
      <InputLabel id={label}>{label}</InputLabel>
      <Select
        disabled={disabled}
        name={name}
        label={label}
        fullWidth
        variant="standard"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '98%', marginRight: '2%' }}
      >
        {siteType.map(zone => (
          <MenuItem key={zone.id} value={zone.id}>
            {zone.name}
          </MenuItem>
        ))}
      </Select>
    </span>
  )
}

export default SiteTypeSelect
