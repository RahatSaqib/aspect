import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

export class NotificationList extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <div className="content">
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
