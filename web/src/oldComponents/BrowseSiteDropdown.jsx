import React from 'react'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import useI18n from '../hooks/useI18n'
import { fetchSitesForSelectList } from '../store/SiteRedux'
import styles from './BrowseSiteDropdown.css'
import { mergeToFiltersParams } from './filter/utils'
import requirePermissions from './shared/requirePermissions'
import StyledDropdown from './shared/StyledDropdown'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  allSites: {
    id: 'pages.SiteDropdown.allSites',
    defaultMessage: 'Region: {region}',
  },
})

const enhance = compose(
  requirePermissions({
    permissions: ['dashboard:siteFilter'],
  }),
  connect(
    state => ({
      sitesSelectList: state.site.selectList,
    }),
    {
      fetchSitesForSelectList,
    }
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSitesForSelectList()
    },
  }),
  withHandlers({
    onChange:
      ({ navigate, location }) =>
      ({ target: { value } }) => {
        const searchParams = new URLSearchParams(location.search)
        const filtersParams = mergeToFiltersParams(
          { siteId: value },
          new URLSearchParams(searchParams.get('filters') || '')
        )
        searchParams.set('filters', filtersParams)
        navigate(
          {
            ...location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      },
  }),
  withProps(({ location, sitesSelectList, theme }) => {
    const { formatMessage } = useI18n()
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')

    return {
      theme,
      isSingleSite: sitesSelectList.items.size === 1 && !sitesSelectList.stateName,
      source: sitesSelectList.items
        .map(item => ({
          value: item.get('id'),
          label: item.get('name'),
        }))
        .insert(0, {
          value: '',
          label: formatMessage(messages.allSites, {
            region: sitesSelectList.stateName || sitesSelectList.countryName,
          }),
        })
        .toJS(),
      value: sitesSelectList.items
        .find(it => it.get('id') === filtersParams.get('siteId'), null, Immutable.Map())
        .get('id', ''),
    }
  })
)

const SiteDropdown = ({ isSingleSite, source, ...restProps }) =>
  source.length > 1 &&
  (isSingleSite ? (
    <div className={cssClasses('SiteDropdown__Label')}>{source[1].label}</div>
  ) : (
    <StyledDropdown displayEmpty source={source} {...restProps} />
  ))

export default enhance(SiteDropdown)
