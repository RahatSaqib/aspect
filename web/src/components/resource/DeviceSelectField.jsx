import React, { useCallback } from 'react'
import { MenuItem } from '@mui/material'
import { useIntl } from 'react-intl'
import { useDeviceForSelect } from '../../hooks/device/useDeviceForSelect'
import deviceMessages from '../../messages/deviceMessages'
import SelectField from '../shared/SelectField'

function DeviceSelectField({
  countryId,
  partnerId,
  siteId,
  deviceTypeExternalId,
  onDeviceChange,
  value,
  disabled,
  ...restProps
}) {
  const { formatMessage } = useIntl()
  const { data = [], isLoading } = useDeviceForSelect({ countryId, partnerId, siteId, deviceTypeExternalId })

  const handleChange = useCallback(
    ({ target: { value } }) => {
      onDeviceChange(value)
    },
    [onDeviceChange]
  )

  const disable = disabled || data.length === 0 || isLoading
  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={handleChange}
      helperText={restProps.helperText || (data.length === 0 ? 'No devices for this site' : '')}
      disabled={disable}
    >
      {data.length > 0 &&
        data.map(s => (
          <MenuItem key={s.id} value={s.id}>
            {s.siteName
              ? formatMessage(deviceMessages.nameAtSite, { deviceName: s.name, siteName: s.siteName })
              : s.name}
          </MenuItem>
        ))}
    </SelectField>
  )
}

export default DeviceSelectField
