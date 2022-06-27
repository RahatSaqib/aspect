import classnames from 'classnames/bind'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import Grid from '@material-ui/core/Grid'

import Button from '@material-ui/core/Button'
import { PropTypes } from 'prop-types'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { makeSearchParamsSanitizer } from '../../shared/selectors/searchParams'

import NavTitle from '../../globals/components/NavTitle'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'

import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'

import {
  InventoryDataTable,
  InventoryDataTableHead,
} from '../list/InventoryDataTable'
import InventoryOnHandTableRow from './InventoryOnHandTableRow'
import { INVENTORY_LIST } from '../../MigratedComponents/QueryFetch/Inventory'
import messages from '../list/messages'

import styles from './InventoryItemsList.css'

const cssClasses = classnames.bind(styles)

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [],
})

export const InventoryOnHandItemsList = ({ navigate, location }) => {
  // >>>>>> Defining hooks <<<<<<
  const intl = useIntl()
  const [siteName, setSiteName] = useState('')
  const [consumableName, setConsumableName] = useState('')
  const [dataTableItems, setDataTableItems] = useState([])

  const { siteId, consumableId } = useParams()
  // >>>>>> Defining queries <<<<<<
  const params = {
    breakOutByLot: true,
    siteId,
    consumableId,
  }
  const onBackClick = () => navigate(-1)

  const {
    isError,
    isLoading,
    data = false,
    error,
    refetch,
  } = useQuery([INVENTORY_LIST.KEY, params], async () => {
    return fetchWrapperForQueries({ endpoint: INVENTORY_LIST.ENDPOINT, params })
  })

  // >>>>>> Lifecycle hooks <<<<<<
  useEffect(() => {
    if (data.data?.length > 0) {
      setSiteName(data.data[0].siteName)
      setConsumableName(data.data[0].consumableName)
      setDataTableItems(data.data)
    }
  }, [data, refetch])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    if (sanitized) {
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }
  }, [location, navigate])

  if (isError) throw new Error(error)

  const columns = [
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
    },
    {
      key: 'quantityOnHand',
      label: intl.formatMessage(messages.quantityOnHand),
    },
    {
      key: 'newQuantityOnHand',
      label: intl.formatMessage(messages.newQuantityOnHand),
    },
    {
      key: 'resultQuantityOnHand',
      label: intl.formatMessage(messages.resultQuantityOnHand),
    },

    {
      key: 'quantityOnHandNote',
      label: intl.formatMessage(messages.inventoryOnNote),
    },
    {
      key: 'actions',
    },
  ]
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <DataTableCard className={cssClasses('DataTableCard--title')}>
        <Grid container>
          <Grid item xs={11}>
            <h2>
              {siteName} - {consumableName}
            </h2>
          </Grid>
          <Grid item xs={1}>
            <Button variant="contained" color="primary" onClick={onBackClick}>
              {intl.formatMessage(messages.backButton)}
            </Button>
          </Grid>
        </Grid>
      </DataTableCard>
      <DataTableCard
        key={`DataTableCard--table-${location.key}`}
        className={cssClasses('DataTableCard--table')}
      >
        <DataTableProgressBar disabled={!isLoading} />
        {dataTableItems && dataTableItems.length === 0 && (
          <BrowseEmptyList navigate={navigate} location={location} />
        )}
        {dataTableItems && dataTableItems.length > 0 && (
          <InventoryDataTable className={cssClasses('InventoryDataTable')}>
            <InventoryDataTableHead
              navigate={navigate}
              location={location}
              columns={columns}
            />
            <TableBody>
              {dataTableItems.map(inventoryItem => (
                <InventoryOnHandTableRow
                  key={inventoryItem.id}
                  inventoryItem={inventoryItem}
                  breakOutByLot
                  navigate={navigate}
                  location={location}
                  refreshData={refetch}
                />
              ))}
            </TableBody>
          </InventoryDataTable>
        )}
      </DataTableCard>
    </div>
  )
}

export default InventoryOnHandItemsList
InventoryOnHandItemsList.propTypes = {
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
}
