import React from 'react'
import { LinearProgress } from '@mui/material'
import { useIntl } from 'react-intl'
import { ConsumableSelector, PeriodSelector } from '../../../../../cleanComponents'
import { usePathFilter } from '../../../../../hooks/usePathFilter'
import NestedTable from '../../../components/NestedTable'
import PkPage from '../../../components/PkPage'
import messages from '../../../PkDashboard.Messages'
import useInventoryOverview from './useInventoryOverview'

const InventoryOverviewPage = () => {
  const { formatMessage } = useIntl()
  const [filters, setFilter] = usePathFilter()

  function getInventoryLabel(item, isState) {
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

  const columns = [
    { key: 'Name', name: formatMessage(messages.utilizationName), prop: 'name' },
    {
      key: 'Current Qty.',
      name: formatMessage(messages.currentQty),
      prop: 'quantity',
      tooltip: 'Its the current quantity in hand, including the expired quantity.',
    },
    {
      key: 'Last 6 Months',
      name: formatMessage(messages.last6Months),
      prop: 'usedLastSixMonths',
      tooltip:
        'Its the total cartridges consumed in last 6 months, irrespective of the period selected in filter option',
    },
    {
      key: 'Used',
      name: formatMessage(messages.used),
      prop: 'usedInDateRange',
      tooltip: 'Its the total cartidges consumed in the date range filter selected',
    },
    {
      key: 'Consumption Rate',
      name: formatMessage(messages.consumptionRate),
      prop: 'dailyConsumptionRate',
      tooltip: 'Its the average daily consumption of the specific cartridge considering the date range selected',
    },
    {
      key: 'Days Left',
      name: formatMessage(messages.daysLeft),
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
