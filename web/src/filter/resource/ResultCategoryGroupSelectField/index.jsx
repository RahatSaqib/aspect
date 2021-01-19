// Imports from packages
// import { defineMessages, useIntl } from 'react-intl'
// import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
// import { useDispatch, useSelector } from 'react-redux'

// Material-UI
import MenuItem from '@material-ui/core/MenuItem'

import SelectField from '../../../components/shared/SelectField'
import fetchWrapperForQueries from '../../../MigratedComponents/QueryFetch'
import RESULT_CATEGORY_GROUP_SELECT_LIST from '../../../MigratedComponents/QueryFetch/ResultCategoryGroup/index'
import { types } from './ResultCategoryGroupSelectFieldRedux'

// const messages = defineMessages({
//   active: {
//     id: 'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.active',
//     defaultMessage: 'Active',
//   },
//   reportedActive: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.reportedActive',
//     defaultMessage: 'Reported Active',
//   },
//   inactiveUnknown: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveUnknown',
//     defaultMessage: 'Unknown',
//   },
//   inactiveNoResultsReported: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveNoResultsReported',
//     defaultMessage: 'No Results Reported',
//   },
//   inactiveOutOfInventory: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveOutOfInventory',
//     defaultMessage: 'Out Of Inventory',
//   },
//   inactiveDownForRepair: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDownForRepair',
//     defaultMessage: 'Down For Repair',
//   },
//   inactiveConnectivity: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveConnectivity',
//     defaultMessage: 'Connectivity',
//   },
//   inactiveDecommissioned: {
//     id:
//       'pages.DeviceMaintenanceStatusSelectField.maintenanceStatus.inactiveDecommissioned',
//     defaultMessage: 'Decommissioned',
//   },
// })

export default ({
  onResultCategoryGroupChange,
  value,
  assayId,
  ...restProps
}) => {
  // const intl = useIntl()
  const { data, isError } = useQuery(
    RESULT_CATEGORY_GROUP_SELECT_LIST.KEY,
    async () =>
      fetchWrapperForQueries({
        endpoint: RESULT_CATEGORY_GROUP_SELECT_LIST.ENDPOINT,
        params: { assayId },
      })
  )

  const [resultCategoryGroups, setResultCategoryGroups] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    if (data && !isError) {
      const items = data.data
      setResultCategoryGroups(items)
      dispatch({
        type: types.RECEIVE_RESULT_CATEGORY_GROUP,
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
        onResultCategoryGroupChange(value)
      }}
    >
      {resultCategoryGroups
        ? resultCategoryGroups.map(rcg => (
            <MenuItem key={rcg.externalId} value={rcg.externalId}>
              {/* {intl.formatMessage(messages[ms.i18nKey])} */}
              {rcg.externalId}
            </MenuItem>
          ))
        : null}
    </SelectField>
  )
}
