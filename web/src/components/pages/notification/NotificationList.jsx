// Imports from packages
import React from 'react'
import Helmet from 'react-helmet'

export class NotificationList extends React.PureComponent {
  render() {
    return (
      <div className="content">
        <Helmet title="Notifications" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            Notifications Here!
          </div>
        </div>
      </div>
    )
  }
}

export default NotificationList
