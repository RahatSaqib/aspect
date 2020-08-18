import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import { useQuery } from 'react-query'
import filter from 'lodash/filter'

import _ from 'lodash'

import flowRight from 'lodash/flowRight'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import map from 'lodash/map'
import Immutable from 'immutable'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Card from '@material-ui/core/Card'
import LinearProgress from '../../components/shared/DelayShowingProgressBar'
import { Unit } from '../../components/pureGrids'
import { fetchStatDashboard } from '../DashboardRedux'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'
import AspectTooltip from '../../components/shared/AspectTooltip'
import AspectLink from '../../components/shared/AspectLink'
import IconProvider from '../../MigratedComponents/IconProvider'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'

const cssClasses = classnames.bind(require('./Status.css'))

/**
 * TODO: https://ops.systemone.id/browse/ASP-1521
 * Correct filters to page navigation
 *
 * TODO: https://ops.systemone.id/browse/ASP-1522
 * Refactor lifecycles and code-reuse
 */

// Order of widget groups - values must correspond to WIDGET_GROUP_KEYS in 'api/seeds/fixtures/dashboardWidgetsBase.js'
// which in their turn correspond keys in 'web/src/dashboard/status/messages.js'
const availableGroupI18nKeys = [
  'summaryWidgetGroupConnectivity',
  'summaryWidgetGroupInventory',
  'summaryWidgetGroupDevices',
  'summaryWidgetGroupService',
]

const widgetMessageTypeList = [
  {
    value: 'title',
    i18nKey: 'titleI18nKey',
  },
  {
    value: 'subTitle',
    i18nKey: 'subTitleI18nKey',
  },
  {
    value: 'statUnit',
    i18nKey: 'statUnitI18nKey',
  },
  {
    value: 'statStatus',
    i18nKey: 'statStatusI18nKey',
  },
  {
    value: 'extraUnit',
    i18nKey: 'extraUnitI18nKey',
  },
  {
    value: 'extraLabel',
    i18nKey: 'extraLabelI18nKey',
  },
]

const enhance = compose(
  requirePermissions({
    permissions: ['dashboard:summary', 'operationalData:view'],
  }),
  connect(
    state => ({
      summary: state.dashboard.summary,
      allSummaryItems: state.dashboard.allSummaryItems,
    }),
    bindActionCreators.bind(null, {
      fetchStatDashboard,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchStatDashboard, dashboard }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      console.log(filtersParams)

      fetchStatDashboard(filtersParams, { dashboard })
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  }),
  withProps(({ summary, allSummaryItems }) => {
    const allWidgets = summary
      .get('currentIdList')
      .map(id => allSummaryItems.getIn(['byId', id]))
    const defaultMessages = allWidgets.reduce(
      (acc, widget) =>
        flowRight(
          x =>
            reduce(
              x,
              (acc, { value, i18nKey }) =>
                set(acc, widget.get(i18nKey), {
                  key: widget.get(i18nKey),
                  id: `pages.status.${widget.get(i18nKey)}`,
                  defaultMessage: widget.get(value),
                }),
              acc
            ),
          x => filter(x, ({ value }) => !!widget.get(value))
        )(widgetMessageTypeList),
      []
    )
    const getItemsInGroup = groupI18nKey => {
      const itemIds =
        summary.getIn(['widgetGroups', groupI18nKey]) || Immutable.List()
      return itemIds.map(id => allSummaryItems.getIn(['byId', id])).toJS()
    }
    const widgetGroups = availableGroupI18nKeys
      .map(groupI18nKey => ({
        groupI18nKey,
        items: getItemsInGroup(groupI18nKey),
      }))
      .filter(({ items }) => items.length > 0)

    // TODO: calculate width of each group to widen it's size if only few
    // groups visible and some groups have many items

    return {
      defaultMessages,
      allWidgets: allWidgets.toJS(),
      widgetGroups,
      nonGroupedWidgets: getItemsInGroup(' '),
      loading: summary.get('loading') && allWidgets.toJS().length === 0,
    }
  })
)

const formatMessage = (key, widget, intl, defaultMessages) => {
  const i18nKey = widget[`${key}I18nKey`]
  const messageDescriptor = messages[i18nKey] || defaultMessages[i18nKey]
  return messageDescriptor
    ? intl.formatMessage(messageDescriptor, widget)
    : widget[key]
}

export const Widget = ({ intl, defaultMessages, widget }) => {
  const description = formatMessage(
    'description',
    widget,
    intl,
    defaultMessages
  )
  return (
    <AspectLink
      to={widget.link}
      className={cssClasses('Summary', {
        'Summary_Link--disabled': !widget.link,
      })}
      testId="SummaryStatus--Summary_Link"
    >
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <IconProvider icon={widget.icon} className="summaryCard__icon" />
          <span className={cssClasses('Summary__Card__Title--main')}>
            {formatMessage('title', widget, intl, defaultMessages)}

            <span className={cssClasses('Summary__Card__Title--sub')}>
              {formatMessage('subTitle', widget, intl, defaultMessages)}
            </span>
          </span>
          {description ? (
            <AspectTooltip showHelpIcon title={description} />
          ) : null}
        </div>
        <div className={cssClasses('Summary__Card__Content')}>
          <div className={cssClasses('Summary__Card__Item')}>
            <div className={cssClasses('Summary__Card__Item__Count')}>
              {widget.count}
            </div>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {formatMessage('statUnit', widget, intl, defaultMessages)}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {formatMessage('statStatus', widget, intl, defaultMessages)}
              </div>
            </div>
          </div>
          <div className={cssClasses('Summary__Card__Item--right')}>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {widget.extra}
                {formatMessage('extraUnit', widget, intl, defaultMessages)}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {formatMessage('extraLabel', widget, intl, defaultMessages)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AspectLink>
  )
}

// const getItemsInGroup = groupI18nKey => {
//   const itemIds =
//     summary.getIn(['widgetGroups', groupI18nKey]) || Immutable.List()
//   return itemIds.map(id => allSummaryItems.getIn(['byId', id])).toJS()
// }

// const widgetGroups = availableGroupI18nKeys
//   .map(groupI18nKey => ({
//     groupI18nKey,
//     items: getItemsInGroup(groupI18nKey),
//   }))
//   .filter(({ items }) => items.length > 0)

const formatMe = (data, dashboard) => {
  const widgetGroups = []
  const nonGroupedWidgets = []
  availableGroupI18nKeys.map(group => {
    const items = filter(data, [
      'dashboards',
      `{"${dashboard}": {"groupI18nKey": "${group}"}}`,
    ])
    if (items && items.length) {
      widgetGroups.push({ groupI18nKey: group, items })
    }
    return widgetGroups
  })

  return { widgetGroups, nonGroupedWidgets }
}

export const SummaryStatus = ({
  intl,
  className,
  dashboard = 'home',
  // --- injected by recompose ---
  // defaultMessages,
  // widgetGroups = [],
  // nonGroupedWidgets,
  // loading,
}) => {
  const [widgets, setWidgets] = useState(false)
  const defaultMessages = false
  const widgetGroups = false
  const nonGroupedWidgets = false
  const loading = false

  const { isError, data, error } = useQuery(`${dashboard}Widgets`, async () =>
    fetchWrapperForQueries(`/dashboard/summary?dashboard=${dashboard}`)
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (data) {
      setWidgets(formatMe(data, dashboard))
    }
  }, [data])

  console.log(widgets)

  // /dashboard/summary
  // console.log({ defaultMessages, widgetGroups, nonGroupedWidgets, loading })

  return (
    <div className={className}>
      {/*
    ----------------
    --- 1. first show non-grouped widgets
    ----------------
    */}
      {/* {map(nonGroupedWidgets, widget => {
        const description = formatMessage(
          'description',
          widget,
          intl,
          defaultMessages
        )
        const widgetProps = { intl, defaultMessages, widget }
        return (
          <Unit key={widget.id} sm="1-2" lg="1-4">
            <Widget {...widgetProps} />
          </Unit>
        )
      })} */}
      {/*
    ----------------
    --- 2. then show widgets in groups
    ----------------
    */}
      {/* {loading && (
        <div
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <LinearProgress />
        </div>
      )} */}
      {/* {widgetGroups.length > 0 && (
        <Card className={cssClasses('Summary_Card_Groups')}>
          {widgetGroups.map(group => {
            return (
              <Unit
                key={group.groupI18nKey}
                sm="1-2"
                lg="1-4"
                className={cssClasses('Summary_Group_Wrapper')}
              >
                <div className={cssClasses('Summary_Group')}>
                  <div className={cssClasses('Summary_Group_Title')}>
                    {formatMessage('group', group, intl, defaultMessages)}
                  </div>
                  <div className={cssClasses('Summary_Group_Widgets')}>
                    {group.items.map(widget => (
                      <Widget {...{ intl, defaultMessages, widget }} />
                    ))}
                  </div>
                </div>
              </Unit>
            )
          })}
        </Card>
      )} */}
    </div>
  )
}

export default enhance(SummaryStatus)
