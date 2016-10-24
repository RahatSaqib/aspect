// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import { isEditable } from '../../shared/selectors/person'
import {
  fetchSinglePerson,
  updateSinglePerson
} from '../PersonRedux'

import messages from './messages'
import styles from './PersonDetail.css'

/*
 * This page component renders a single site
 */
export class PersonDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired
  }

  handleFetchPerson = ({ params }) => {
    this.props.fetchSinglePerson(params.personId)
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchPerson(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.personId !== nextProps.params.personId) {
      this.handleFetchPerson(nextProps)
    }
  }

  render() {
    const {
      intl: { formatMessage },
      updateSinglePerson,
      person, editable
    } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {!person && <LinearProgress />}
          <div className={styles.FieldsContainer}>
            {!editable && <span>{person.get('name')}</span>}
            {editable && <input value={person.get('name')} />}
            {editable && <button onClick={updateSinglePerson}>Save</button>}
          </div>
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state, { params }) {
  const person = state.person.items.byId.get(params.personId)

  return {
    editable: isEditable(state.user, person),
    person
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSinglePerson,
    updateSinglePerson
  }, dispatch)
}

export const PersonDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonDetail)
