import { defineMessages } from 'react-intl'
import resultMessages from '../../oldPages/result/list/messages'

const messages = {
  ...resultMessages,
  ...defineMessages({
    testHistory: {
      id: 'pages.DeviceDetailProfile.testHistory',
      defaultMessage: 'Test history',
    },
  }),
}

export default messages
