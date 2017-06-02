// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'

// Our own imports
import DataTable from './DataTable'
import EmptyList from './EmptyList'

const enhance = compose(setPropTypes(DataTable.propTypes), pure)

export const DataTableWithEmptyList = props =>
  !props.table.loading && props.items.currentIdList.isEmpty()
    ? <EmptyList />
    : <DataTable {...props} />

export default enhance(DataTableWithEmptyList)
