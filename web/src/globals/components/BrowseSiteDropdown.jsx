import Immutable from 'immutable'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import { mergeToFiltersParams } from '../../filter/utils'
import requirePermissions from '../../components/shared/requirePermissions'

const enhance = compose(
  requirePermissions({
    features: ['siteFilterDashboard'],
  }),
  connect(
    state => ({
      sitesSelectList: state.site.selectList,
    }),
    bindActionCreators.bind(null, {
      fetchSitesForSelectList,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
    },
  }),
  withHandlers({
    onChange: ({ history, location }) => value => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = mergeToFiltersParams(
        { siteId: value },
        new URLSearchParams(searchParams.get('filters') || '')
      )
      searchParams.set('filters', filtersParams)
      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
  }),
  withProps(({ location, ...restProps }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    return {
      source: restProps.sitesSelectList.items
        .map(item => ({
          value: item.get('id'),
          label: item.get('name'),
        }))
        .insert(0, { value: '', label: 'All Sites' })
        .toJS(),
      value: restProps.sitesSelectList.items
        .find(
          it => it.get('id') === filtersParams.get('siteId'),
          null,
          Immutable.Map()
        )
        .get('id', ''),
    }
  })
)

export default enhance(StyledDropdown)
