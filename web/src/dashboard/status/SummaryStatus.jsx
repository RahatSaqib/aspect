import classnames from 'classnames/bind'
import React from 'react'
import _ from 'lodash'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Card } from 'react-toolbox/lib/card'
import { Unit } from '../../components/pureGrids'
import Indicator from '../../components/shared/Indicator'
import { fetchSummaryDashboard } from '../DashboardRedux'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

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
  connect(
    state => ({
      summary: state.dashboard.summary,
    }),
    bindActionCreators.bind(null, {
      fetchSummaryDashboard,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchSummaryDashboard }) => () => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      fetchSummaryDashboard(filtersParams)
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
        _.flowRight(
          x =>
            _.reduce(
              x,
              (acc, { value, i18nKey }) =>
                _.set(acc, widget.get(i18nKey), {
                  key: widget.get(i18nKey),
                  id: `pages.status.${widget.get(i18nKey)}`,
                  defaultMessage: widget.get(value),
                }),
              acc
            ),
          x => _.filter(x, ({ value }) => !!widget.get(value))
        )(widgetMessageTypeList),
      []
    )

    return {
      defaultMessages,
    }
  })
)

const Icon = ({ icon, className }) => {
  try {
    const Icon = require(`react-icons/lib/md/${icon}`) // eslint-disable-line import/no-dynamic-require
    return <Icon className={className} />
  } catch (e) {
    return <div />
  }
}

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
    {_.map(summary.toJS(), widget => (
      <Unit sm="1-2" lg="1-4">
        <Link to={widget.link} className={cssClasses('Summary')}>
          <Card className={cssClasses('Summary__Card')}>
            <div className={cssClasses('Summary__Card__Title')}>
              <Icon
                icon={widget.icon}
                className={cssClasses('Summary__Card__Title__Icon')}
              />
              {formatMessage('title', widget, intl, defaultMessages)}
              <span className={cssClasses('Summary__Card__Title__Sub')}>
                {formatMessage('subTitle', widget, intl, defaultMessages)}
              </span>
            </div>
            <div className={cssClasses('Summary__Card__Content')}>
              <div className={cssClasses('Summary__Card__Item')}>
                <div className={cssClasses('Summary__Card__Item__Count')}>
                  {widget.count}
                </div>
                <div className={cssClasses('Summary__Card__Item__Messages')}>
                  <div>
                    {formatMessage('statUnit', widget, intl, defaultMessages)}
                  </div>
                  <div
                    className={cssClasses('Summary__Card__Item__Messages--sub')}
                  >
                    {formatMessage('statStatus', widget, intl, defaultMessages)}
                  </div>
                </div>
                {widget.target && (
                  <Indicator
                    indicator={widget.indicator}
                    coloredIndicator={widget.coloredIndicator}
                    isGreaterThan={
                      parseFloat(widget.count) > parseFloat(widget.target)
                    }
                  />
                )}
              </div>
              <div className={cssClasses('Summary__Card__Item--right')}>
                <div className={cssClasses('Summary__Card__Item__Messages')}>
                  <div>
                    {widget.extra}
                    {formatMessage('extraUnit', widget, intl, defaultMessages)}
                  </div>
                  <div
                    className={cssClasses('Summary__Card__Item__Messages--sub')}
                  >
                    {formatMessage('extraLabel', widget, intl, defaultMessages)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </Unit>
    ))}
  </div>
)

export default enhance(SummaryStatus)
