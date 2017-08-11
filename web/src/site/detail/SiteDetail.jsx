import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import isEditable from '../../shared/selectors/site'
import { fetchSingleSite, updateSingleSite, Site } from '../SiteRedux'
import SiteForm from './SiteForm'
import SiteLocationFormMap from './SiteLocationFormMap'
import messages from './messages'
import styles from './SiteDetail.css'

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        siteId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  pure,
  injectIntl,
  connect(
    (state, props) => {
      const site = state.site.items.byId.get(props.match.params.siteId)

      return {
        editable: isEditable(state.user, site),
        site,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleSite,
          updateSingleSite,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    editable: PropTypes.bool.isRequired,
    site: PropTypes.objectOf(Site),
    fetchSingleSite: PropTypes.func.isRequired,
    updateSingleSite: PropTypes.func.isRequired,
  })
)

export class SiteDetail extends PureComponent {
  componentDidMount() {
    this.handleFetchSite(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.siteId !== nextProps.match.params.siteId) {
      this.handleFetchSite(nextProps)
    }
  }

  handleFetchSite = ({ match }) => {
    this.props.fetchSingleSite(match.params.siteId)
  }

  hasSiteWithLocation() {
    const { site } = this.props
    return site && site.has('longitude') && site.has('latitude')
  }

  render() {
    const {
      intl: { formatMessage },
      updateSingleSite,
      site,
      editable,
    } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />
        <Paper>
          {!this.hasSiteWithLocation() && <LinearProgress />}
          {this.hasSiteWithLocation() &&
            <div className={styles.FieldsContainer}>
              <SiteForm
                formatMessage={formatMessage}
                onSubmit={updateSingleSite}
                editable={editable}
                site={site}
              />
            </div>}
          {this.hasSiteWithLocation() &&
            <SiteLocationFormMap editable={editable} site={site} />}
        </Paper>
      </div>
    )
  }
}

export default enhance(SiteDetail)
