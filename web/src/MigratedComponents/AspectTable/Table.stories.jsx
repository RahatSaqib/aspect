import React from 'react'
import { IntlProvider } from 'react-intl'
import AspectTable from './index'

import { mockDatafetch } from './Helpers'

const { data } = mockDatafetch(87)
const config = {
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: 'Last Triggered',
      width: 20,
      disableHide: true,
    },
    {
      key: 'name',
      label: 'Name',
      width: 35,
    },
    {
      key: 'totalTriggers',
      label: 'Total Triggers',
      width: 20,
    },
    {
      key: 'contacts',
      label: 'Contacts',
      disableSortBy: true,
      width: 25,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
}

config.columnOrder = {
  allow: true,
  initialOrder: ['contacts', 'name', 'lastTriggeredOn', 'totalTriggers'],
}

export default {
  title: 'Layouts/AspectTable/Examples/Kitchen Sink',
  component: AspectTable,
}

const Template = args => (
  <IntlProvider locale="en">
    <AspectTable {...args} />
  </IntlProvider>
)

export const Default = Template.bind({})
Default.args = {
  tableData: data,
  config,
}
