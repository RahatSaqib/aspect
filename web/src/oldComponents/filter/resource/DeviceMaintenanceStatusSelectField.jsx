// Imports from packages
import { useQuery } from 'react-query'
import PropTypes from 'prop-types'

// Material-UI
import MenuItem from '@mui/material/MenuItem'

import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import SelectField from '../../shared/SelectField'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { DEVICE_STATUS } from '../../../components/QueryFetch/Device/index'
import useI18n from '../../../hooks/i18n/useI18n'
import messages from '../../../utils/messages/deviceStatusMessages'
import formatI18nMessage from '../../../utils/i18n/formatterWeb'
import { types } from '../../../store/DeviceMaintenanceStatusRedux'
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
  const { formatMessage } = useI18n()
  const { data: maintenanceStatuses, isLoading } = useMaintenanceStatus(onlyManuallySetableStatuses)
  const dispatch = useDispatch()

  useEffect(() => {
    if (maintenanceStatuses) {
      dispatch({
        type: types.RECEIVE_DEVICE_MAINTENCE_STATUS,
        items: maintenanceStatuses,
        lastRefreshed: new Date(),
      })
    }
  }, [dispatch, maintenanceStatuses])

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
          {formatI18nMessage(messages, formatMessage, ms.i18nKey, ms.i18nKey)}
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
