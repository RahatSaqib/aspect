import React from 'react'
import IconProvider from '../index'

export default {
  title: 'providers/components/IconProvider',
  argTypes: {
    icon: {
      control: {
        type: 'select',
        options: [
          'MdPermIdentity',
          'MdAlarmOn',
          'MdAndroid',
          'FaRebel',
          'FaBowlingBall',
          'Undefined - Should default to base "?" Icon',
        ],
      },
    },
    className: { table: { disable: true }, controls: { disable: true } },
  },
  component: IconProvider,
}

const Template = ({ icon, ...rest }) => <IconProvider icon={icon} {...rest} />

export const Default = Template.bind({})

Default.args = {
  icon: 'MdPermIdentity',
  className: 'summaryCard__icon',
}
