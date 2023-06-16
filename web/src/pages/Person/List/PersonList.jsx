import React, { useState, useEffect } from 'react'
import { TableBody, LinearProgress } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import PersonFilter from '../../../cleanComponents/Filter/PersonFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import PermissionChecker from '../../../components/PermissionChecker'
import usePersons from '../../../hooks/person/usePersons'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { isPermittedUser } from '../../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { PersonDataTable, PersonDataTableHead, PersonDataTableRow } from './PersonDataTable'
import styles from './PersonList.css'
import getExportableFile from './PersonQueries'

const cssClasses = classnames.bind(styles)

export const PersonList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { formatMessage } = useI18n()
  const { userPermissions, user } = useAuthState()
  const filters = useFilterValues(location.pathname)
  const sortPage = makeSortPageSelector({ sortCol: 'name' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })

  const [isLoading, setIsLoading] = useState(true)

  const {
    isLoading: tableLoading,
    data = { data: [] },
    total,
  } = usePersons({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters })

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  const isEditAllow = isPermittedUser(userPermissions, { required: ['person:edit'] })

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filters, formatType, sortCol, sortDir, 0, total, 'contacts')
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
          <AspectButton color="primary" variant="contained" browseButton onClick={() => navigate('/browse/person/add')}>
            {formatMessage(messages.addContact)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.contactsTitle)} />
        <PersonFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton onExport={onExportClick} visible={data.data.length !== 0} />
          </div>
          {isLoading ? <LinearProgress /> : null}
          {data.data?.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <PersonDataTable className={cssClasses('PersonDataTable')}>
                <PersonDataTableHead
                  navigate={navigate}
                  location={location}
                  sortColumnKey={sortCol}
                  sortColumnDir={sortDir}
                  columns={[
                    { key: 'name', label: formatMessage(messages.personName), sortable: true },
                    { key: 'level', label: formatMessage(messages.level), sortable: true },
                    { key: 'state', label: getCustomMessage(messages, 'state', user), sortable: true },
                    { key: 'lga', label: getCustomMessage(messages, 'lga', user), sortable: true },
                    { key: 'tags', label: formatMessage(messages.tags), sortable: true },
                    isEditAllow && { key: 'actions', label: formatMessage(messages.enableDisable), sortable: false },
                  ]}
                />
                <TableBody>
                  {data.data.map(person => (
                    <PersonDataTableRow
                      key={person.id}
                      person={person}
                      onClick={e => navigate(`/browse/person/${e.currentTarget.dataset.personId}`)}
                      data-person-id={person.id}
                      personEditPermission={isEditAllow && user?.userId !== person.id}
                    />
                  ))}
                </TableBody>
              </PersonDataTable>
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
