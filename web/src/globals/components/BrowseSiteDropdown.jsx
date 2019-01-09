import React from 'react'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { defineMessages } from 'react-intl'
import StyledDropdown from '../../components/shared/StyledDropdown'
import { fetchSitesForSelectList } from '../../site/SiteRedux'
import { mergeToFiltersParams } from '../../filter/utils'
import requirePermissions from '../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('./BrowseSiteDropdown.css'))

const messages = defineMessages({
  allSites: {
    id: 'pages.SiteDropdown.allSites',
    defaultMessage: 'Region: {region}',
  },
})

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
    onChange: ({ history, location }) => ({ target: { value } }) => {
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
  withProps(({ intl, location, sitesSelectList, theme }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    return {
      theme,
      isSingleSite:
        sitesSelectList.items.size === 1 && !sitesSelectList.stateName,
      source: sitesSelectList.items
        .map(item => ({
          value: item.get('id'),
          label: item.get('name'),
        }))
        .insert(0, {
          value: '',
          label: intl.formatMessage(messages.allSites, {
            region: sitesSelectList.stateName || sitesSelectList.countryName,
          }),
        })
        .toJS(),
      value: sitesSelectList.items
        .find(
          it => it.get('id') === filtersParams.get('siteId'),
          null,
          Immutable.Map()
        )
        .get('id', ''),
    }
  })
)

const SiteDropdown = ({ isSingleSite, source, ...restProps }) =>
  source.length > 1 &&
  (isSingleSite ? (
    <div className={cssClasses('SiteDropdown__Label')}>{source[1].label}</div>
  ) : (
    <StyledDropdown source={source} {...restProps} />
  ))

export default enhance(SiteDropdown)
