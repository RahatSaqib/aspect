import React, { useState } from 'react'
import { Box, Card, LinearProgress, Table, TableBody, TableRow } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { StatesFilter } from '../../../components'
import DetailHeader from '../../../components/DetailHeader'
import AspectVertMenu from '../../../components/AspectVertMenu'
import PermissionChecker from '../../../components/PermissionChecker'
import { useAdminStates } from '../../../hooks/admin/useAdminStates'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
import { getCustomMessage } from '../../../messages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DataTableCell } from '../../../oldComponents/shared/tableBody'
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
  const [filters] = usePathFilter()
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const { data, isLoading } = useAdminStates(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, stateId: filters.stateId }, isNil)
  )

  return (
    <>
      <DetailHeader name={getCustomMessage(formatMessage, messages, 'state', user)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton
            onClick={() => setAddState(true)}
            type="button"
            color="primary"
            variant="contained"
            browseButton
          >
            {formatMessage(messages.createNew)} {getCustomMessage(formatMessage, messages, 'state', user)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <Box sx={{ padding: '10px', width: '100%' }}>
        <Helmet title={getCustomMessage(formatMessage, messages, 'state', user)} />
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
                    { key: 'name', label: formatMessage(messages.name), sortable: true },
                    { key: 'abbreviation', label: formatMessage(messages.abbreviation), sortable: true },
                    { key: 'apiKeys', label: formatMessage(messages.apiKeys) },
                    { key: 'people', label: formatMessage(messages.people) },
                    { key: 'lgas', label: getCustomMessage(formatMessage, messages, 'lga', user) },
                    { key: 'sites', label: formatMessage(messages.sites) },
                    { key: 'issues', label: formatMessage(messages.issues) },
                    { key: 'notificationStates', label: formatMessage(messages.notificationStates) },
                    { key: 'peopleWithAccess', label: formatMessage(messages.peopleWithAccess) },
                    { key: 'manage', label: formatMessage(messages.manage) },
                  ]}
                />
                <TableBody>
                  {data.data.map((state, index) => (
                    <TableRow sx={{ bgcolor: index % 2 ? '#fff' : '#eef1f8' }} key={state.name}>
                      <DataTableCell>{state.name}</DataTableCell>
                      <DataTableCell>{state.abbreviation}</DataTableCell>
                      <DataTableCell>{state.deviceApiKeyCount}</DataTableCell>
                      <DataTableCell>{state.personCount}</DataTableCell>
                      <DataTableCell>{state.lgaCount}</DataTableCell>
                      <DataTableCell>{state.siteCount}</DataTableCell>
                      <DataTableCell>{state.issueCount}</DataTableCell>
                      <DataTableCell>{state.notificationCount}</DataTableCell>
                      <DataTableCell>{state.jobContextCount}</DataTableCell>
                      <DataTableCell>
                        <AspectVertMenu
                          actions={[
                            {
                              icon: 'FaEdit',
                              text: formatMessage(messages.edit),
                              action: () => setEditingState(state),
                            },
                            {
                              icon: 'FaTrash',
                              text: formatMessage(messages.delete),
                              disabled: !!state.cannotDelete,
                              action: () => setRemovingState(state),
                            },
                          ]}
                        />
                      </DataTableCell>
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
      </Box>
      <AddStateDialog open={addState} onOpenChange={setAddState} />
      <RemoveStateDialog open={!!removingState} state={removingState} onOpenChange={setRemovingState} />
      <EditStateDialog open={!!editingState} state={editingState} onOpenChange={setEditingState} />
    </>
  )
}
