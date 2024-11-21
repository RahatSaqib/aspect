import React, { useCallback } from 'react'
import { LinearProgress } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { ConsumableSelector, PeriodSelector } from '../../../../../cleanComponents'
import useFilterUpdate from '../../../../../hooks/useFilterUpdate'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import useInventoryOverview from './useInventoryOverview'

const InventoryOverviewPage = () => {
  const { formatMessage } = useIntl()
  const [filters, setFilter] = usePathFilter()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()

  function getInventoryLabel(item, isState) {
    if (item.type === 'clinic') return item?.lab
    if (item.type && item[item.type]) return item.type && item[item.type]
    return isState ? formatMessage(messages.noAssociatedState) : formatMessage(messages.noAssociatedLga)
  }

  function transformInventory(data) {
    const isState = data?.some(item => item.type === 'state')
    return data?.map(item => ({
      ...item,
      name: getInventoryLabel(item, isState),
      children: transformInventory(item.children ?? []),
      usedLastSixMonths: item.type === 'warehouse' ? '-' : item.usedLastSixMonths ?? 0,
      daysOfInventoryLeft: item.type === 'warehouse' ? '-' : item.daysOfInventoryLeft ?? 0,
      usedInDateRange: item.type === 'warehouse' ? '-' : item.usedInDateRange ?? 0,
      dailyConsumptionRate: item.type === 'warehouse' ? '-' : item.dailyConsumptionRate ?? 0,
    }))
  }

  const { isLoading, data } = useInventoryOverview(
    {
      consumableExternalId: filters.consumable?.consumableExternalId,
      minDate: filters.minDate,
      maxDate: filters.maxDate,
    },
    { enabled: !!filters.consumable?.consumableExternalId }
  )

  const handleUnreconciledClick = useCallback(
    ({ countryId, stateId, lgaId, name, type }) => {
      addFilter(
        omitBy(
          {
            assayId: filters?.consumable?.assayId,
            onlyUnreconciled: true,
            countryId,
            stateId,
            lgaId,
            siteName: type === 'lab' || type === 'clinic' ? name : null,
          },
          isNil
        ),
        '/browse/result'
      )
      navigate('/browse/result')
    },
    [addFilter, filters, navigate]
  )

  const columns = [
    { name: 'Name', prop: 'name' },
    {
      name: 'Current Qty.',
      prop: 'quantity',
      tooltip: 'Its the current quantity in hand, including the expired quantity.',
    },
    {
      name: 'Current Unreconciled Qty.',
      prop: 'unreconciledQuantity',
      cellProp: c => ({
        sx: c.unreconciledQuantity ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' } : undefined,
        onClick: () => handleUnreconciledClick(c),
      }),
      tooltip: 'Total cartridges consumed and reported under tests but not yet adjusted against the inventory',
    },
    {
      name: 'Last 6 Months',
      prop: 'usedLastSixMonths',
      tooltip:
        'Its the total cartridges consumed in last 6 months, irrespective of the period selected in filter option',
    },
    {
      name: 'Used',
      prop: 'usedInDateRange',
      tooltip: 'Its the total cartidges consumed in the date range filter selected',
    },
    {
      name: 'Consumption Rate',
      prop: 'dailyConsumptionRate',
      tooltip: 'Its the average daily consumption of the specific cartridge considering the date range selected',
    },
    {
      name: 'Days Left',
      prop: 'daysOfInventoryLeft',
      tooltip:
        'The number of days left with available and not-expired cartridge and the daily consumption rate of the cartridges',
    },
  ]

  return (
    <PkPage
      title={formatMessage(messages.overview)}
      filters={
        <>
          <ConsumableSelector
            fullWidth
            value={filters.consumable || null}
            onChange={consumable => setFilter(prv => ({ ...prv, consumable }))}
          />
          <PeriodSelector
            label={formatMessage(messages.date)}
            minDate={filters.minDate || null}
            maxDate={filters.maxDate || null}
            onChange={dateValues => setFilter({ ...filters, ...dateValues })}
          />
        </>
      }
    >
      {isLoading ? (
        <LinearProgress />
      ) : (
        <NestedTable
          columns={columns}
          rows={transformInventory(data)}
          allowPagination={false}
          allowCustomOrder={false}
        />
      )}
    </PkPage>
  )
}
export default InventoryOverviewPage
