import React from 'react'
import { IntlProvider } from 'react-intl'
import { MuiThemeProvider } from '@material-ui/core/styles'

import theme from '../../theme'
import AspectTable from './index'

import { mockDatafetch } from './Helpers'
import config from '../Notifications/List/config'

const { data } = mockDatafetch(90)

export default {
  title: 'Layouts/AspectTable/Kitchen Sink',
  component: AspectTable,
}

const Template = args => (
  <MuiThemeProvider theme={theme}>
    <IntlProvider locale="en">
      <AspectTable {...args} />
    </IntlProvider>
  </MuiThemeProvider>
)

export const Default = Template.bind({})
Default.args = {
  tableData: data,
  config,
}
