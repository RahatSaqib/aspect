// Imports from packages
import { useQuery } from 'react-query'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../components/shared/SelectField'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { DEVICE_STATUS } from '../../MigratedComponents/QueryFetch/Device/index'
import { types } from '../../MigratedComponents/Devices/Maintenance/DeviceMaintenanceStatusRedux'
import useI18n from '../../Hooks/i18n/useI18n'
import messages from '../../shared/messages/deviceStatusMessages'
import formatI18nMessage from '../../shared/i18n/formatterWeb'

const DeviceMaintenanceStatusSelectField = ({
  onDeviceMaintenanceStatusChange,
  value,
  allItemText,
  multiple,
  onlyManuallySetableStatuses,
  ...restProps
}) => {
  const { formatMessage } = useI18n()
  const { data, isError } = useQuery([DEVICE_STATUS.KEY, onlyManuallySetableStatuses], async () => {
    return fetchWrapperForQueries({
      endpoint: DEVICE_STATUS.ENDPOINT,
      params: { onlyManuallySet: onlyManuallySetableStatuses },
    })
  })

  const [maintenanceStatuses, setMaintenanceStatuses] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    if (data && !isError) {
      const items = data.data
      setMaintenanceStatuses(items)
      dispatch({
        type: types.RECEIVE_DEVICE_MAINTENCE_STATUS,
        items,
        lastRefreshed: new Date(),
      })
    }
  }, [data, dispatch, isError])

  const onChange = ({ target: { value } }) => {
    onDeviceMaintenanceStatusChange(value.includes('all') ? undefined : value)
  }

  return (
    <SelectField {...restProps} value={value} onChange={onChange} multiple={multiple}>
      {allItemText && <MenuItem value="all">{allItemText}</MenuItem>}
      {maintenanceStatuses
        ? maintenanceStatuses.map(ms => (
            <MenuItem key={ms.externalId} value={ms.externalId}>
              {formatI18nMessage(messages, formatMessage, ms.i18nKey, ms.i18nKey)}
            </MenuItem>
          ))
        : null}
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
