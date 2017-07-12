import { themr } from 'react-css-themr'
import { tableFactory } from 'react-toolbox/lib/table/Table'
import { TABLE } from 'react-toolbox/lib/identifiers'

import DataTableHead from '../../components/shared/DataTableHead'
import SiteTableRow from './SiteTableRow'

const RawTable = tableFactory(DataTableHead, SiteTableRow)
export const SiteDataTable = themr(TABLE)(RawTable)

export {
  DataTableHead as SiteDataTableHead,
  SiteTableRow as SiteDataTableRow,
}
