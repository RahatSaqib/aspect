import React, { useEffect, useState } from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, PersonFilter, TableContainer } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import PermissionChecker from '../../../components/PermissionChecker'
import AspectButton from '../../../components/shared/AspectButton'
import DataTableCard from '../../../components/shared/DataTableCard'
import { isPermittedUser } from '../../../components/shared/requirePermissions'
import usePersons from '../../../hooks/person/usePersons'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import { getCustomMessage } from '../../../messages/customMessages'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import { PersonDataTable, PersonDataTableHead, PersonDataTableRow } from './PersonDataTable'
import styles from './PersonList.module.css'
import getExportableFile from './PersonQueries'

export const PersonList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useIntl()
  const { userPermissions, user } = useAuthState()
  const filters = useFilterValues(location.pathname)
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })

  const [isLoading, setIsLoading] = useState(true)

  const {
    isLoading: tableLoading,
    data = { data: [] },
    refetch,
  } = usePersons({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters })

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  const isEditAllow = isPermittedUser(userPermissions, { required: ['person:edit'] })

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filters, formatType, sortCol, sortDir, data.total, 'contacts')
      .then(response => {
        setIsLoading(false)
        return response
      })
      .catch(error => {
        setIsLoading(false)
        throw error
      })
  }
  return (
    <>
      <DetailHeader name={formatMessage(messages.contactsTitle)} disableBack>
        <PermissionChecker permissions={['person:edit']}>
          <AspectButton
            color="primary"
            variant="contained"
            browseButton
            onClick={() => gotoWithReturnUrl('/browse/person/add', navigate, location)}
          >
            {formatMessage(messages.addContact)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.contactsTitle)} />
        <PersonFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton onExport={onExportClick} visible={data.data.length !== 0} />
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : !data || !data.data || data.data.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <TableContainer>
                <PersonDataTable className={styles.PersonDataTable}>
                  <PersonDataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={[
                      { key: 'name', label: formatMessage(messages.personName), sortable: true },
                      { key: 'assignments', label: formatMessage(messages.assignments), sortable: true },
                      { key: 'state', label: getCustomMessage(formatMessage, messages, 'state', user), sortable: true },
                      { key: 'lga', label: getCustomMessage(formatMessage, messages, 'lga', user), sortable: true },
                      { key: 'tags', label: formatMessage(messages.tags), sortable: true },
                      { key: 'email', label: formatMessage(messages.email), sortable: true },
                      { key: 'cell', label: formatMessage(messages.cell), sortable: true },
                      { key: 'phone', label: formatMessage(messages.phone), sortable: true },
                      { key: 'lastLogin', label: formatMessage(messages.lastLogin), sortable: true },
                      isEditAllow && { key: 'actions', label: formatMessage(messages.enableDisable), sortable: false },
                    ]}
                  />
                  <TableBody>
                    {data.data.map(person => (
                      <PersonDataTableRow
                        key={person.id}
                        person={person}
                        onClick={e =>
                          gotoWithReturnUrl(`/browse/person/${e.currentTarget.dataset.personId}`, navigate, location)
                        }
                        onUpdateRecord={refetch}
                        data-person-id={person.id}
                        personEditPermission={isEditAllow && user?.userId !== person.id}
                      />
                    ))}
                  </TableBody>
                </PersonDataTable>
              </TableContainer>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                paginatorStatus={messages.paginatorStatus}
                total={data.total}
                pageAt={pageAt}
                pageSize={pageSize}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </>
  )
}

export default PersonList
