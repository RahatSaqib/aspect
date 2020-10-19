import React from 'react'
import { IntlProvider } from 'react-intl'
import AspectTable from './index'

import { mockDatafetch } from './Helpers'
import config from '../Notifications/List/config'

const { data } = mockDatafetch(87)

config.columnOrder = ['contacts', 'name', 'lastTriggeredOn', 'totalTriggers']

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
