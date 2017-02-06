import Immutable from 'immutable'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

export default Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'createdOn',
    sortDir: 'desc',
    page: 0,
    pageSize: 10,
  }),
})
