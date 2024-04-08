import React, { useCallback, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, Card, Table, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import PermissionChecker from '../../../components/PermissionChecker'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DataTableCell, DataTableRow } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from '../messages'
import { AddStateDialog } from './AddStateDialog'
import { EditStateDialog } from './EditStateDialog'
import { RemoveStateDialog } from './RemoveStateDialog'

const states = [{ name: 'Alabama', abbreviation: 'AL', id: 30 }]

export default function StatesPage() {
  const { formatMessage } = useIntl()
  const [addState, setAddState] = useState(false)
  const [removingState, setRemovingState] = useState()
  const [editingState, setEditingState] = useState()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthState()
  const [addFilter] = useFilterUpdate()
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir } = sortPage({ location })
  const handleRowClick = useCallback(
    ({ id }) => {
      const url = '/browse/admin/lgas'
      addFilter({ stateId: id, countryId: user.countryId }, url)
      navigate(url)
    },
    [navigate, addFilter, user]
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
        <Card sx={{ padding: '20px' }}>
          <Table>
            <DataTableHead
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
                { key: 'name', label: formatMessage(messages.stateName), sortable: true },
                { key: 'abbreviation', label: formatMessage(messages.stateAbbreviation), sortable: true },
                { key: 'manage', label: formatMessage(messages.manage) },
              ]}
            />
            <TableBody>
              {states.map(i => (
                <DataTableRow onClick={() => handleRowClick(i)} key={i.name}>
                  <DataTableCell>{i.name}</DataTableCell>
                  <DataTableCell>{i.abbreviation}</DataTableCell>
                  <DataTableCell>
                    <Button
                      onClick={e => {
                        e.stopPropagation()
                        setRemovingState(i.name)
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
        </Card>
      </Box>
      <AddStateDialog open={addState} onOpenChange={setAddState} />
      <RemoveStateDialog open={!!removingState} onOpenChange={setRemovingState} />
      <EditStateDialog open={!!editingState} state={editingState} onOpenChange={setEditingState} />
    </>
  )
}
