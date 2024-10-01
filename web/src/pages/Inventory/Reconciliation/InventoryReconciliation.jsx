import React, { useMemo } from 'react'
import { Box, Card, LinearProgress, Stack, Switch, Table, TableBody, TableRow, Typography } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import { InventoryReconciliationFilter } from '../../../cleanComponents/Filter'
import {
  HierarchicalSiteView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../cleanComponents/HierarchicalSiteView'
import useAuthState from '../../../hooks/useAuthState'
import useFilterSync from '../../../hooks/useFilterSync'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import useInventoryReconciliation from '../../../hooks/inventory/useInventoryReconciliation'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { DataTableCell } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { getColumns } from './tools'

const data = { data: [] }
const isLoading = false
export function InventoryReconciliation() {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const location = useLocation()
  const navigate = useNavigate()
  const [addFilter] = useFilterUpdate()
  const [state, setState] = useFilterSync()
  const [isHierarchicalView, setIsHierarchicalView] = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_RECONCILIATION,
  })
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const columns = useMemo(
    () => getColumns(formatMessage, [true, 'true'].includes(state.breakOutByLot), user),
    [formatMessage, state.breakOutByLot, user]
  )
  return (
    <>
      <DetailHeader name={formatMessage(messages.inventoryReconciliation)} disableBack />
      <Helmet title={formatMessage(messages.inventoryReconciliation)} />
      <Box sx={{ width: '100%', p: '10px' }}>
        <InventoryReconciliationFilter state={state} setState={setState} />
        <Stack sx={{ flexDirection: 'row', gap: 1, width: '100%' }}>
          {isHierarchicalView && (
            <HierarchicalSiteView
              countryId={user.countryId}
              filters={state}
              pathname="/browse/inventory/reconciliation"
            />
          )}

          <Card sx={{ padding: '20px', flex: 1 }}>
            <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={isHierarchicalView}
                  onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                />
                Hierarchical View
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={[true, 'true'].includes(state.breakOutByLot)}
                  onChange={e => {
                    const payload = { ...state, breakOutByLot: e.target.checked || null }
                    setState(payload)
                    addFilter(payload, location.pathname)
                  }}
                />
                Breakdown by Lots
              </Typography>
            </Stack>
            {isLoading ? (
              <LinearProgress />
            ) : !data || !data.data || data.data.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <Table>
                  <DataTableHead
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={columns}
                  />
                  <TableBody>
                    {data.data.map((state, index) => (
                      <TableRow sx={{ bgcolor: index % 2 ? '#fff' : '#eef1f8' }} key={state.name}>
                        <DataTableCell>{state.name}</DataTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <BrowseTablePaginator
                  location={location}
                  paginatorStatus={messages.statesPaginatorStatus}
                  total={data.total}
                  pageAt={pageAt}
                  pageSize={pageSize}
                  navigate={navigate}
                />
              </>
            )}
          </Card>
        </Stack>
      </Box>
    </>
  )
}
