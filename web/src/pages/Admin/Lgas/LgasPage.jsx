import React, { useState } from 'react'
import { Box, Card, LinearProgress, Table, TableBody, TableRow } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { LgasFilter } from '../../../components'
import AspectVertMenu from '../../../components/AspectVertMenu'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import DetailHeader from '../../../components/DetailHeader'
import PermissionChecker from '../../../components/PermissionChecker'
import AspectButton from '../../../components/shared/AspectButton'
import { DataTableCell } from '../../../components/shared/tableBody'
import DataTableHead from '../../../components/shared/tableHead'
import { useAdminLgas } from '../../../hooks/admin/useAdminLgas'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
import { getCustomMessage } from '../../../messages'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from '../messages'
import { AddLgaDialog } from './AddLgaDialog'
import { EditLgaDialog } from './EditLgaDialog'
import { RemoveLgaDialog } from './RemoveLgaDialog'

export default function LgasPage() {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const navigate = useNavigate()
  const [addLga, setAddLga] = useState(false)
  const [removingLga, setRemovingLga] = useState()
  const [editingLga, setEditingLga] = useState()
  const [filters] = usePathFilter()
  const user = useAuthState()
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const { data, isLoading } = useAdminLgas(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, stateId: filters.stateId, name: filters.lgaName }, isNil)
  )

  return (
    <>
      <DetailHeader name={getCustomMessage(formatMessage, messages, 'lga', user)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton onClick={() => setAddLga(true)} type="button" color="primary" variant="contained" browseButton>
            {formatMessage(messages.createNew)} {getCustomMessage(formatMessage, messages, 'lga', user)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <Box sx={{ padding: '10px', width: '100%' }}>
        <Helmet title={getCustomMessage(formatMessage, messages, 'lga', user)} />
        <LgasFilter />
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
                    { key: 'stateName', label: getCustomMessage(formatMessage, messages, 'state', user) },
                    { key: 'apiKeys', label: formatMessage(messages.apiKeys) },
                    { key: 'people', label: formatMessage(messages.people) },
                    { key: 'sites', label: formatMessage(messages.sites) },
                    { key: 'issues', label: formatMessage(messages.issues) },
                    { key: 'notificationStates', label: formatMessage(messages.notificationStates) },
                    { key: 'peopleWithAccess', label: formatMessage(messages.peopleWithAccess) },
                    { key: 'manage', label: formatMessage(messages.manage) },
                  ]}
                />
                <TableBody>
                  {data.data.map((l, i) => (
                    <TableRow
                      sx={{ bgcolor: i % 2 ? '#fff' : '#eef1f8' }}
                      onClick={() => {}}
                      key={`${l.id}-${l.stateId}`}
                    >
                      <DataTableCell style={{ pointerEvents: 'none' }}>{l.name}</DataTableCell>
                      <DataTableCell>{l.stateName}</DataTableCell>
                      <DataTableCell>{l.deviceApiKeyCount}</DataTableCell>
                      <DataTableCell>{l.personCount}</DataTableCell>
                      <DataTableCell>{l.siteCount}</DataTableCell>
                      <DataTableCell>{l.issueCount}</DataTableCell>
                      <DataTableCell>{l.notificationCount}</DataTableCell>
                      <DataTableCell>{l.jobContextCount}</DataTableCell>
                      <DataTableCell>
                        <AspectVertMenu
                          actions={[
                            {
                              icon: 'FaEdit',
                              text: formatMessage(messages.edit),
                              action: () => setEditingLga(l),
                            },
                            {
                              icon: 'FaTrash',
                              text: formatMessage(messages.delete),
                              disabled: !!l.cannotDelete,
                              action: () => setRemovingLga(l),
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
                paginatorStatus={messages.lgaPaginatorStatus}
                total={data.total}
                pageAt={pageAt}
                pageSize={pageSize}
                navigate={navigate}
              />
            </>
          )}
        </Card>
      </Box>
      <AddLgaDialog open={addLga} onOpenChange={setAddLga} />
      <RemoveLgaDialog open={!!removingLga} lga={removingLga} onOpenChange={setRemovingLga} />
      <EditLgaDialog open={!!editingLga} lga={editingLga} onOpenChange={setEditingLga} />
    </>
  )
}
