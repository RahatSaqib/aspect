import React, { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, Card, LinearProgress, Table, TableBody } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { LgasFilter } from '../../../cleanComponents'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import PermissionChecker from '../../../components/PermissionChecker'
import { useAdminLgas } from '../../../hooks/admin/useAdminLgas'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DataTableCell, DataTableRow } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
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
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const { data, isLoading } = useAdminLgas(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, stateId: filters.stateId, name: filters.lgaName }, isNil)
  )

  return (
    <>
      <DetailHeader name={formatMessage(messages.lgas)} disableBack>
        <PermissionChecker permissions={['deviceApiKey:edit', 'deviceApiKey:admin']}>
          <AspectButton onClick={() => setAddLga(true)} type="button" color="primary" variant="contained" browseButton>
            {formatMessage(messages.createNewLga)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <Box sx={{ padding: '10px', width: '100%' }}>
        <Helmet title={formatMessage(messages.lgas)} />
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
                    { key: 'name', label: formatMessage(messages.lgaName), sortable: true },
                    { key: 'stateName', label: formatMessage(messages.stateName) },
                    { key: 'apiKeys', label: formatMessage(messages.apiKeys) },
                    { key: 'people', label: formatMessage(messages.people) },
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
                    <DataTableRow onClick={() => {}} key={i.name}>
                      <DataTableCell>{i.name}</DataTableCell>
                      <DataTableCell>{i.stateName}</DataTableCell>
                      <DataTableCell>{i.deviceApiKeyCount}</DataTableCell>
                      <DataTableCell>{i.personCount}</DataTableCell>
                      <DataTableCell>{i.siteCount}</DataTableCell>
                      <DataTableCell>{i.issueCount}</DataTableCell>
                      <DataTableCell>{i.deviceConfigurationCount}</DataTableCell>
                      <DataTableCell>{i.notificationCount}</DataTableCell>
                      <DataTableCell>{i.jobContextCount}</DataTableCell>
                      <DataTableCell>
                        <Button
                          disabled={!!i.cannotDelete}
                          onClick={e => {
                            e.stopPropagation()
                            setRemovingLga(i)
                          }}
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                        >
                          {formatMessage(messages.delete)}
                        </Button>
                        <Button
                          sx={{ ml: '5px' }}
                          onClick={e => {
                            e.stopPropagation()
                            setEditingLga(i)
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
