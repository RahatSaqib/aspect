import React from 'react'
import { MenuItem } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../QueryFetch'
import { DEVICE_STATUS } from '../QueryFetch/Device/index'
import { deviceStatusMessages } from '../../messages'
import formatI18nMessage from '../../utils/i18n/formatterWeb'
import SelectField from '../shared/SelectField'

// TODO: move to HOOKS folder
const getMaintenanceStatus = async onlyManuallySetableStatuses =>
  fetchWrapperForQueries({
    endpoint: DEVICE_STATUS.ENDPOINT,
    params: { onlyManuallySet: onlyManuallySetableStatuses },
  }).then(response => response.data)

const useMaintenanceStatus = onlyManuallySetableStatuses =>
  useQuery([DEVICE_STATUS.KEY, onlyManuallySetableStatuses], () => getMaintenanceStatus(onlyManuallySetableStatuses))

const DeviceMaintenanceStatusSelectField = ({
  onDeviceMaintenanceStatusChange,
  value,
  allItemText,
  multiple,
  onlyManuallySetableStatuses,
  ...restProps
}) => {
  const { formatMessage } = useIntl()
  const { data: maintenanceStatuses, isLoading } = useMaintenanceStatus(onlyManuallySetableStatuses)

  const onChange = ({ target: { value } }) => {
    onDeviceMaintenanceStatusChange(value.includes('all') ? undefined : value)
  }

  const list = allItemText
    ? [...(maintenanceStatuses || []), { externalId: 'all', i18nKey: allItemText }]
    : maintenanceStatuses || []

  return isLoading ? null : (
    <SelectField {...restProps} value={value} onChange={onChange} multiple={multiple}>
      {list.map(ms => (
        <MenuItem key={ms.externalId} value={ms.externalId}>
          {formatI18nMessage(deviceStatusMessages, formatMessage, ms.i18nKey, ms.i18nKey)}
        </MenuItem>
      ))}
    </SelectField>
  )
}

DeviceMaintenanceStatusSelectField.defaultProps = {
  value: '',
  allItemText: '',
  onlyManuallySetableStatuses: false,
  multiple: false,
}

DeviceMaintenanceStatusSelectField.propTypes = {
  onDeviceMaintenanceStatusChange: PropTypes.oneOfType([PropTypes.func]).isRequired,
  multiple: PropTypes.oneOfType([PropTypes.bool]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  allItemText: PropTypes.oneOfType([PropTypes.string]),
  onlyManuallySetableStatuses: PropTypes.oneOfType([PropTypes.bool]),
}

export default DeviceMaintenanceStatusSelectField
