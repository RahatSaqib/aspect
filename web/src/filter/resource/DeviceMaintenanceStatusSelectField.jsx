// Imports from packages
import { defineMessages, useIntl } from 'react-intl'
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

const messages = defineMessages({
  active: {
    id: 'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.active',
    defaultMessage: 'Active',
  },
  reportedActive: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.reportedActive',
    defaultMessage: 'Reported Active',
  },
  inactiveUnknown: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveUnknown',
    defaultMessage: 'Unknown',
  },
  inactiveNoTestsPerformed: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveNoTestsPerformed',
    defaultMessage: 'No Tests Performed',
  },
  inactiveOutOfInventory: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveOutOfInventory',
    defaultMessage: 'Out Of Inventory',
  },
  inactiveDownForRepair: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDownForRepair',
    defaultMessage: 'Down For Repair',
  },
  inactiveConnectivity: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveConnectivity',
    defaultMessage: 'Connectivity',
  },
  inactiveDecommissioned: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDecommissioned',
    defaultMessage: 'Decommissioned',
  },
  inactiveNoStaff: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveNoStaff',
    defaultMessage: 'No Staff',
  },
  inactiveNoPower: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveNoPower',
    defaultMessage: 'No Power',
  },
  inactiveOther: {
    id:
      'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveOther',
    defaultMessage: 'Other',
  },
})

const DeviceMaintenanceStatusSelectField = ({
  onDeviceMaintenanceStatusChange,
  value,
  onlyManuallySet,
  ...restProps
}) => {
  const intl = useIntl()
  const { data, isError } = useQuery(
    [DEVICE_STATUS.KEY, onlyManuallySet],
    async () => {
      return fetchWrapperForQueries({
        endpoint: DEVICE_STATUS.ENDPOINT,
        params: { onlyManuallySet },
      })
    }
  )

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

  return (
    <SelectField
      {...restProps}
      value={value}
      onChange={({ target: { value } }) => {
        onDeviceMaintenanceStatusChange(value)
      }}
    >
      {maintenanceStatuses
        ? maintenanceStatuses.map(ms => (
            <MenuItem key={ms.externalId} value={ms.externalId}>
              {intl.formatMessage(messages[ms.i18nKey])}
            </MenuItem>
          ))
        : null}
    </SelectField>
  )
}

DeviceMaintenanceStatusSelectField.defaultProps = {
  value: null,
  onlyManuallySet: false,
}

DeviceMaintenanceStatusSelectField.propTypes = {
  onDeviceMaintenanceStatusChange: PropTypes.oneOfType([PropTypes.func])
    .isRequired,
  value: PropTypes.oneOfType([PropTypes.string]),
  onlyManuallySet: PropTypes.oneOfType([PropTypes.bool]),
}

export default DeviceMaintenanceStatusSelectField
