import React from 'react'
import PermIdentity from '@mui/icons-material/PermIdentity'
import { Card, IconButton, Table, TableBody, Tooltip } from '@mui/material'
import classnames from 'classnames/bind'
import map from 'lodash/map'
import omit from 'lodash/omit'
import { MdFileDownload } from 'react-icons/md'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import messages from '../list/messages'
import cssStyles from './HistoryResults.css'

const cssClasses = classnames.bind(cssStyles)

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
}) => {
  const { formatMessage } = useI18n()

  return (
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
          {table.loading ? (
            <DataTableProgressBar disabled={!table.loading} />
          ) : items.currentIdList.isEmpty() ? (
            <BrowseEmptyList />
          ) : (
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
                        map(
                          columns.filter(col => col.key !== 'resultText'),
                          elem => (
                            <TableCell key={`${result.get('id')}-${elem.key}`} hiddenOn={elem.hiddenOn || 'sm'}>
                              {elem.tooltip && result.get(elem.key) && (
                                <Tooltip title={result.get(elem.tooltip)} disableInteractive>
                                  <PermIdentity className={styles[`${result.get(elem.key)}`]} />
                                </Tooltip>
                              )}
                              {!elem.tooltip &&
                                (elem.formatter ? elem.formatter(result.get(elem.key)) : result.get(elem.key))}
                            </TableCell>
                          )
                        )}

                      <TableCell>
                        {`${formatMessage(
                          messages[result.get('resultCategory1Titlei18nKey')],
                          null,
                          result.get('resultCategory1Title')
                        )}:${formatMessage(
                          messages[result.get('resultCategory1I18nKey')],
                          null,
                          result.get('resultCategory1Name')
                        )}`}
                        {result.get('resultCategory2I18nKey') &&
                          result.get('resultCategory2Titlei18nKey') &&
                          ` | ${formatMessage(
                            messages[result.get('resultCategory2Titlei18nKey')],
                            null,
                            result.get('resultCategory2Title')
                          )}:${formatMessage(
                            messages[result.get('resultCategory2I18nKey')],
                            null,
                            result.get('resultCategory2Name')
                          )}`}
                        {result.get('resultCategory2I18nKey') &&
                          !result.get('resultCategory2Titlei18nKey') &&
                          ` | ${formatMessage(
                            messages[result.get('resultCategory2I18nKey')],
                            null,
                            result.get('resultCategory2Name')
                          )}`}
                      </TableCell>
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
}

export default Results
