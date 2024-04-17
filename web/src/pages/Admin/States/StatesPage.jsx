import React, { useCallback, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, Card, LinearProgress, Table, TableBody } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { StatesFilter } from '../../../cleanComponents'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import PermissionChecker from '../../../components/PermissionChecker'
import { useAdminStates } from '../../../hooks/admin/useAdminStates'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DataTableCell, DataTableRow } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from '../messages'
import { AddStateDialog } from './AddStateDialog'
import { EditStateDialog } from './EditStateDialog'
import { RemoveStateDialog } from './RemoveStateDialog'

export default function StatesPage() {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const [addState, setAddState] = useState(false)
  const [removingState, setRemovingState] = useState()
  const [editingState, setEditingState] = useState()
  const location = useLocation()
  const user = useAuthState()
  const [addFilter] = useFilterUpdate()
  const [filters] = usePathFilter()
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const handleRowClick = useCallback(
    ({ id }) => {
      const url = '/browse/admin/lgas'
      addFilter({ stateId: id, countryId: user.countryId }, url)
      navigate(url)
    },
    [navigate, addFilter, user]
  )
  const { data, isLoading } = useAdminStates(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, name: filters.stateName }, isNil)
  )

  return (
    <>
      <DetailHeader name={formatMessage(messages.states)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton
            onClick={() => setAddState(true)}
            type="button"
            color="primary"
            variant="contained"
            browseButton
          >
            {formatMessage(messages.createNewState)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <Box sx={{ padding: '10px', width: '100%' }}>
        <Helmet title={formatMessage(messages.states)} />
        <StatesFilter />
        <Card sx={{ padding: '20px' }}>
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
                  columns={[
                    { key: 'name', label: formatMessage(messages.stateName), sortable: true },
                    { key: 'abbreviation', label: formatMessage(messages.stateAbbreviation), sortable: true },
                    { key: 'apiKeys', label: formatMessage(messages.apiKeys) },
                    { key: 'people', label: formatMessage(messages.people) },
                    { key: 'lgas', label: formatMessage(messages.lgas) },
                    { key: 'sites', label: formatMessage(messages.sites) },
                    { key: 'issues', label: formatMessage(messages.issues) },
                    { key: 'deviceConfigurations', label: formatMessage(messages.deviceConfigurations) },
                    { key: 'notificationStates', label: formatMessage(messages.notificationStates) },
                    { key: 'peopleWithAccess', label: formatMessage(messages.peopleWithAccess) },
                    { key: 'manage', label: formatMessage(messages.manage) },
                  ]}
                />
                <TableBody>
                  {data.data.map(i => (
                    <DataTableRow onClick={() => handleRowClick(i)} key={i.name}>
                      <DataTableCell>{i.name}</DataTableCell>
                      <DataTableCell>{i.abbreviation}</DataTableCell>
                      <DataTableCell>{i.deviceApiKeyCount}</DataTableCell>
                      <DataTableCell>{i.personCount}</DataTableCell>
                      <DataTableCell>{i.lgaCount}</DataTableCell>
                      <DataTableCell>{i.siteCount}</DataTableCell>
                      <DataTableCell>{i.issueCount}</DataTableCell>
                      <DataTableCell>{i.deviceConfigurationCount}</DataTableCell>
                      <DataTableCell>{i.notificationCount}</DataTableCell>
                      <DataTableCell>{i.jobContextCount}</DataTableCell>
                      <DataTableCell>
                        <Button
                          onClick={e => {
                            e.stopPropagation()
                            setRemovingState(i)
                          }}
                          disabled={!!i.cannotDelete}
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                        >
                          {formatMessage(messages.delete)}
                        </Button>
                        <Button
                          sx={{ ml: '5px' }}
                          onClick={e => {
                            e.stopPropagation()
                            setEditingState(i)
                          }}
                          variant="outlined"
                          startIcon={<EditIcon />}
                        >
                          {formatMessage(messages.edit)}
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
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
      </Box>
      <AddStateDialog open={addState} onOpenChange={setAddState} />
      <RemoveStateDialog open={!!removingState} state={removingState} onOpenChange={setRemovingState} />
      <EditStateDialog open={!!editingState} state={editingState} onOpenChange={setEditingState} />
    </>
  )
}
