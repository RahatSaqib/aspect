import React, { useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, Card, Table, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { LgasFilter } from '../../../cleanComponents'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import PermissionChecker from '../../../components/PermissionChecker'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { DataTableCell, DataTableRow } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from '../messages'
import { AddLgaDialog } from './AddLgaDialog'
import { RemoveLgaDialog } from './RemoveLgaDialog'

const lgas = [{ name: 'Lawrence' }]

export default function LgasPage() {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const [addLga, setAddLga] = useState(false)
  const [removingLga, setRemovingLga] = useState()
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir } = sortPage({ location })
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
          <Table>
            <DataTableHead
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
                { key: 'name', label: formatMessage(messages.lgaName), sortable: true },
                { key: 'manage', label: formatMessage(messages.manage) },
              ]}
            />
            <TableBody>
              {lgas.map(i => (
                <DataTableRow onClick={() => {}} key={i.name}>
                  <DataTableCell>{i.name}</DataTableCell>
                  <DataTableCell>
                    <Button
                      sx={{ zIndex: 9 }}
                      onClick={e => {
                        e.stopPropagation()
                        setRemovingLga(i.name)
                      }}
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
      <AddLgaDialog open={addLga} onOpenChange={setAddLga} />
      <RemoveLgaDialog open={!!removingLga} onOpenChange={setRemovingLga} />
    </>
  )
}
