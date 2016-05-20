import React from 'react'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { fetchPersons } from '../../action_creators/person_creators'
import { DataTable } from '../shared/DataTable'
import translate from '../../i18n/translate'

export class PersonList extends React.Component {

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
                    columns={[  { db: 'name', title: this.props.strings.personName },
                                { db: 'level', title: this.props.strings.level },
                                { db: 'state', title: this.props.strings.state },
                                { db: 'lga', title: this.props.strings.lga } ]} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.getIn(['person', 'loading']),
    items: state.getIn(['person', 'items']),
    sortDir: state.getIn(['person', 'sortDir']),
    sortCol: state.getIn(['person', 'sortCol']),
    page: state.getIn(['person', 'page']),
    size: state.getIn(['person', 'size']),
    total: state.getIn(['person', 'total'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleFetch: (sortCol, sortDir, page, size) => {
      dispatch(fetchPersons(sortCol, sortDir, page, size))
    }
  }
}

const PersonListTranslated = translate('PersonList')(PersonList)
export const PersonListContainer = connect(mapStateToProps, mapDispatchToProps)(PersonListTranslated)
