import React from 'react'
import AspectTable from './index'

import { mockDatafetch } from './Helpers'
import config from '../Notifications/List/config'

const { data } = mockDatafetch(10)

export default {
  title: 'Layouts/AspectTable',
  component: AspectTable,
}

const Template = args => <AspectTable {...args} />

export const Default = Template.bind({})
Default.args = {
  tableData: data,
  config,
}
