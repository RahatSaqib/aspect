import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchDevices } from '../../action_creators/device_creators'
import { DataTable } from '../shared/DataTable'
import translate from '../../i18n/translate'
import moment from 'moment'

export class DeviceList extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <div className="content">
        <h1 className="content-h1">{ this.props.strings.title }</h1>
        <DataTable  handleFetch={ this.props.handleFetch }
                    loading={ this.props.loading }
                    items={ this.props.items }
                    sortCol={ this.props.sortCol }
                    sortDir={ this.props.sortDir }
                    page={ this.props.page }
                    size={ this.props.size }
                    total={ this.props.total }
                    columns={[  { db: 'name', title: this.props.strings.deviceName },
                                { db: 'status', title: this.props.strings.status },
                                { db: 'createdOn', title: this.props.strings.reportingFor,
                                  format: (data) => { return moment(data).fromNow(true) } },
                                { db: 'lastSeen', title: this.props.strings.lastSeen,
                                  info: 'When did we last hear from the device?',
                                  format: (data) => { return moment(data).fromNow() } },
                                { db: 'totalTests', title: this.props.strings.totalTests,
                                  format: (data) => { return(data.toLocaleString()) } } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.getIn(['device', 'loading']),
    items: state.getIn(['device', 'items']),
    sortDir: state.getIn(['device', 'sortDir']),
    sortCol: state.getIn(['device', 'sortCol']),
    page: state.getIn(['device', 'page']),
    size: state.getIn(['device', 'size']),
    total: state.getIn(['device', 'total'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleFetch: (sortCol, sortDir, page, size) => {
      dispatch(fetchDevices(sortCol, sortDir, page, size))
    }
  }
}

const DeviceListTranslated = translate('DeviceList')(DeviceList)
export const DeviceListContainer = connect(mapStateToProps, mapDispatchToProps)(DeviceListTranslated)
