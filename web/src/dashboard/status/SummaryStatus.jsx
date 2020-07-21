import React from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import reduce from 'lodash/reduce'
import set from 'lodash/set'
import filter from 'lodash/filter'
import map from 'lodash/map'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Card from '@material-ui/core/Card'
import { Unit } from '../../components/pureGrids'
import { fetchStatDashboard } from '../DashboardRedux'
import requirePermissions from '../../components/shared/requirePermissions'
import messages from './messages'
import AspectTooltip from '../../components/shared/AspectTooltip'
import IconProvider from '../../MigratedComponents/IconProvider'

const cssClasses = classnames.bind(require('./Status.css'))

/**
 * TODO: https://ops.systemone.id/browse/ASP-1521
 * Correct filters to page navigation
 *
 * TODO: https://ops.systemone.id/browse/ASP-1522
 * Refactor lifecycles and code-reuse
 */

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
  withProps(({ summary }) => {
    const defaultMessages = summary.reduce(
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

    return {
      defaultMessages,
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

export const SummaryStatus = ({
  intl,
  className,
  // --- injected by recompose ---
  summary,
  defaultMessages,
}) => (
  <div className={className}>
    {map(summary.toJS(), widget => {
      const description = formatMessage(
        'description',
        widget,
        intl,
        defaultMessages
      )
      return (
        <Unit key={widget.id} sm="1-2" lg="1-4">
          <Link
            to={widget.link || '#'}
            className={cssClasses('Summary', {
              'Summary_Link--disabled': !widget.link,
            })}
            testId="SummaryStatus--Summary_Link"
          >
            <Card className={cssClasses('Summary__Card')}>
              <div className={cssClasses('Summary__Card__Title')}>
                <IconProvider
                  icon={widget.icon}
                  iconClass="summaryCard__icon"
                />
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
                      className={cssClasses(
                        'Summary__Card__Item__Messages--main'
                      )}
                    >
                      {formatMessage('statUnit', widget, intl, defaultMessages)}
                    </div>
                    <div
                      className={cssClasses(
                        'Summary__Card__Item__Messages--sub'
                      )}
                    >
                      {formatMessage(
                        'statStatus',
                        widget,
                        intl,
                        defaultMessages
                      )}
                    </div>
                  </div>
                </div>
                <div className={cssClasses('Summary__Card__Item--right')}>
                  <div className={cssClasses('Summary__Card__Item__Messages')}>
                    <div
                      className={cssClasses(
                        'Summary__Card__Item__Messages--main'
                      )}
                    >
                      {widget.extra}
                      {formatMessage(
                        'extraUnit',
                        widget,
                        intl,
                        defaultMessages
                      )}
                    </div>
                    <div
                      className={cssClasses(
                        'Summary__Card__Item__Messages--sub'
                      )}
                    >
                      {formatMessage(
                        'extraLabel',
                        widget,
                        intl,
                        defaultMessages
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </Unit>
      )
    })}
  </div>
)

export default enhance(SummaryStatus)
