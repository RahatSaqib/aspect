import map from 'lodash/map'
import classnames from 'classnames/bind'
import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Card from '@material-ui/core/Card'
import { MdFileDownload } from 'react-icons/md'
import TableBody from '@material-ui/core/TableBody'
import Table from '@material-ui/core/Table'
import PermIdentity from '@material-ui/icons/PermIdentity'
import Tooltip from '@material-ui/core/Tooltip'
import messages from '../list/messages'
import DataTableHead from '../../components/shared/tableHead'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'

import cssStyles from './HistoryResults.css'

const cssClasses = classnames.bind(cssStyles)
const styles = require('../../components/shared/DataTableRow.css')

export const Results = ({
  intl,
  history,
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
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <Table className={cssClasses('ResultDataTable')}>
            <DataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={columns}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(result => (
                  <TableRow
                    key={result.get('id')}
                    onClick={onRowClick}
                    data-result-id={result.get('id')}
                  >
                    {columns &&
                      map(columns, elem => (
                        <TableCell hiddenOn={elem.hiddenOn || 'sm'}>
                          {elem.tooltip && result.get(elem.key) && (
                            <Tooltip
                              title={result.get(elem.tooltip)}
                              disableInteractive
                            >
                              <PermIdentity
                                className={styles[`${result.get(elem.key)}`]}
                              />
                            </Tooltip>
                          )}
                          {!elem.tooltip &&
                            (elem.formatter
                              ? elem.formatter(result.get(elem.key))
                              : result.get(elem.key))}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
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
