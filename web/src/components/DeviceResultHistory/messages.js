import { defineMessages } from 'react-intl'
import resultMessages from '../../pages/Result/list/messages'

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
