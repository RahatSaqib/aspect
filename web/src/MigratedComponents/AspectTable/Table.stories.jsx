import React from 'react'
import { IntlProvider } from 'react-intl'
import AspectTableCore from './TableCore'

import { mockDatafetch } from './Helpers'
import useI18n from '../../Hooks/i18n/useI18n'

const totalDataCount = 87
const { data } = mockDatafetch(totalDataCount)

const baseConfig = () => ({
  name: 'notification',
  namePlural: 'notifications',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: 'Last Triggered',
      width: 20,
      disableGroupBy: true,
      disableHide: true,
      disableSortBy: false,
    },
    {
      key: 'name',
      label: 'Name',
      width: 35,
      disableGroupBy: true,
      disableHide: true,
      disableSortBy: false,
    },
    {
      key: 'totalTriggers',
      label: 'Total Triggers',
      width: 20,
      disableGroupBy: true,
      disableHide: true,
      disableSortBy: false,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      width: 25,
      disableGroupBy: true,
      disableHide: false,
      disableSortBy: true,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
    initialOrderDesc: true,
  },
})

baseConfig.columnOrder = {
  allow: false,
  initialOrder: ['contacts', 'name', 'lastTriggeredOn', 'totalTriggers'],
  initialOrderDesc: true,
}

export default {
  title: 'Layouts/AspectTable/Examples/Kitchen Sink',
  component: AspectTableCore,
}

const StoryWrapped = args => {
  const intl = useI18n()
  const config = baseConfig(intl)
  return <AspectTableCore config={config} {...args} />
}

const Template = args => {
  return (
    <IntlProvider locale="en">
      <StoryWrapped {...args} />
    </IntlProvider>
  )
}

export const Default = Template.bind({})
Default.args = {
  tableData: { ok: true, total: totalDataCount, data, length: totalDataCount },
  initialState: {
    pageSize: 10,
    sortBy: [],
    pageIndex: 0,
    allowReset: false,
  },
  manualPagination: false,
  isFetching: false,
  setters: {
    handleClearParams: () => false,
    setSize: () => false,
    setSortCol: () => false,
    setSortDir: () => false,
    setPage: () => false,
  },
}
