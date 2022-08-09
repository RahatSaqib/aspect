import map from 'lodash/map'
import omit from 'lodash/omit'
import classnames from 'classnames/bind'
import React from 'react'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import { MdFileDownload } from 'react-icons/md'
import TableBody from '@mui/material/TableBody'
import Table from '@mui/material/Table'
import PermIdentity from '@mui/icons-material/PermIdentity'
import Tooltip from '@mui/material/Tooltip'
import messages from '../list/messages'
import DataTableHead from '../../components/shared/tableHead'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'

import cssStyles from './HistoryResults.css'

const cssClasses = classnames.bind(cssStyles)
const styles = require('../../components/shared/DataTableRow.css')

export const Results = ({
  navigate,
  location,
  sortDir,
  sortCol,
  pageAt,
  pageSize,
  title,
  // injected by recompose
  items,
  table,
  columns,
  onExportClick,
  onRowClick,
}) => (
  <section className={cssClasses('Section')}>
    <Card className={cssClasses('Section__Content')}>
      <header className={cssClasses('Header')}>
        <div className={cssClasses('Header__Title')}>{`${title}`}</div>
        {onExportClick && (
          <div className={cssClasses('Header__Actions')}>
            <IconButton onClick={onExportClick}>
              <MdFileDownload />
            </IconButton>
          </div>
        )}
      </header>
      <div>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
        {!items.currentIdList.isEmpty() && (
          <Table className={cssClasses('ResultDataTable')}>
            <DataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={columns.map(column => omit(column, ['formatter']))}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(result => (
                  <TableRow key={result.get('id')} onClick={onRowClick} data-result-id={result.get('id')}>
                    {columns &&
                      map(columns, elem => (
                        <TableCell key={`${result.get('id')}-${elem.key}`} hiddenOn={elem.hiddenOn || 'sm'}>
                          {elem.tooltip && result.get(elem.key) && (
                            <Tooltip title={result.get(elem.tooltip)} disableInteractive>
                              <PermIdentity className={styles[`${result.get(elem.key)}`]} />
                            </Tooltip>
                          )}
                          {!elem.tooltip &&
                            (elem.formatter ? elem.formatter(result.get(elem.key)) : result.get(elem.key))}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </div>
    </Card>
  </section>
)

export default Results
