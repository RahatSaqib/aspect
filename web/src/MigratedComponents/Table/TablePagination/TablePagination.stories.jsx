import React, { useMemo } from 'react'
import { IntlProvider } from 'react-intl'
import { useTable, useSortBy, usePagination } from 'react-table'

import AspectTablePagination from './index'

import { mockDatafetch, buildColumnsFromData } from '../Helpers'
import config from '../../Notifications/List/config'

const { data } = mockDatafetch(90)

export default {
  title: 'Layouts/AspectTable/Components/Pagination',
  component: AspectTablePagination,
}

const Template = ({ tableData, config }) => {
  const { name } = config
  const columns = useMemo(() => buildColumnsFromData(config), [config])
  const table = useTable({ columns, data }, useSortBy, usePagination)
  const {
    canNextPage,
    canPreviousPage,
    gotoPage,
    nextPage,
    page,
    pageCount,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = table

  const mockedPage = []
  page.map(({ id, index, depth, original }) =>
    mockedPage.push({ id, index, depth, original })
  )

  function handleChangeRowsPerPage(val) {
    setPageSize(typeof val !== 'number' ? data.length : Number(val))
  }

  return (
    <IntlProvider locale="en">
      <AspectTablePagination
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={data.length}
        gotoPage={gotoPage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        nextPage={nextPage}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        previousPage={previousPage}
        page={mockedPage}
        name={name}
      />
    </IntlProvider>
  )
}

export const Default = Template.bind({})

Default.args = {
  tableData: data,
  config,
}
