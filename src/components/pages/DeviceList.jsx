import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchDevices } from '../../action_creators/device_creators'
import { DataTable } from '../shared/DataTable'
import translate from '../../i18n/translate'

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
                    columns={[  { db: 'id', title: 'ID', tooltip: 'The ID of the device' },
                                { db: 'name', title: this.props.strings.deviceName, info: 'The name of the device' },
                                { db: 'shortname', title: this.props.strings.shortName, info: 'The short name of the device' }]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.getIn(['device', 'loading']),
    items: state.getIn(['device', 'items'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleFetch: () => {
      dispatch(fetchDevices())
    }
  }
}

const DeviceListTranslated = translate('DeviceList')(DeviceList)
export const DeviceListContainer = connect(mapStateToProps, mapDispatchToProps)(DeviceListTranslated)
