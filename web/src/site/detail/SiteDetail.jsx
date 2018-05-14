import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import Immutable from 'immutable'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import isEditable from '../../shared/selectors/site'
import { fetchSingleSite, updateSingleSite, Site } from '../SiteRedux'
import { fetchTags, updateTags } from '../../tag/TagRedux'
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
  connect(
    (state, props) => {
      const site = state.site.items.byId.get(props.match.params.siteId)
      const siteTags = state.tag.tags.getIn(
        ['site', props.match.params.siteId],
        Immutable.List()
      )
      return {
        editable: isEditable(state.user, site),
        site,
        siteTags,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleSite,
          updateSingleSite,
          fetchTags,
          updateTags,
        },
        dispatch
      )
  ),
  setPropTypes({
    editable: PropTypes.bool.isRequired,
    site: PropTypes.objectOf(Site),
    siteTags: PropTypes.instanceOf(Immutable.List).isRequired,
    fetchSingleSite: PropTypes.func.isRequired,
    updateSingleSite: PropTypes.func.isRequired,
    fetchTags: PropTypes.func.isRequired,
    updateTags: PropTypes.func.isRequired,
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

  onSiteTagChange = (qryId, qryType, tags) => {
    this.props.updateTags(qryId, qryType, tags.join(','))
  }

  handleFetchSite = ({ match }) => {
    this.props.fetchSingleSite(match.params.siteId)
    this.props.fetchTags(match.params.siteId, 'site')
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
      siteTags,
      editable,
    } = this.props

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />
        <Paper>
          {!this.hasSiteWithLocation() && <LinearProgress />}
          {this.hasSiteWithLocation() && (
            <div className={styles.FieldsContainer}>
              <SiteForm
                formatMessage={formatMessage}
                onSubmit={updateSingleSite}
                onSiteTagChange={this.onSiteTagChange}
                editable={editable}
                site={site}
                siteTags={siteTags.toJS()}
              />
            </div>
          )}
          {this.hasSiteWithLocation() && (
            <SiteLocationFormMap editable={editable} site={site} />
          )}
        </Paper>
      </div>
    )
  }
}

export default enhance(SiteDetail)
