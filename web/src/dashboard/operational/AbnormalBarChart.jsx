import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import withTooltip from 'react-toolbox/lib/tooltip'
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle'
import FaCircle from 'react-icons/lib/fa/circle'

import AbnormalBarGraph from '../../components/graph/AbnormalBarGraph'
import messages from './messages'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const enhance = _.identity

const yDomainMaxBy = {
  'days-unavailable': 14,
}

const Title = ({ title, children, ...restProps }) => (
  <div {..._.omit(restProps, ['tooltip', 'theme'])}>
    {title}
    {children}
  </div>
)

const TitleWithTooltip = withTooltip(Title)

const AbnormalBarChart = ({ component, intl, item, ...restProps }) =>
  React.createElement(
    component,
    {
      ...restProps,
      className: cssClasses(restProps.className, 'AbnormalBarChart'),
    },
    <AbnormalBarGraph
      average={item.get('averageValue')}
      data={item.get('data').toJS()}
      x={it => it.id}
      y={it => it.value}
      yDomainMax={yDomainMaxBy[item.get('key')]}
      fill={it => (it.abnormal ? '#EA4E62' : '#36DED6')}
    />,
    React.createElement(item.get('titleTooltip') ? TitleWithTooltip : Title, {
      className: cssClasses('AbnormalBarChart__Title'),
      title:
        item.get('title') ||
        intl.formatMessage(messages[item.get('titleI18nKey')]),
      tooltip: item.get('titleTooltip'),
    }),
    item.get('message') && (
      <div className={cssClasses('AbnormalBarChart__Message')}>
        {item.get('someAbnormal') ? (
          <FaExclamationTriangle
            className={cssClasses('AbnormalBarChart__Message__Icon--abnormal')}
          />
        ) : (
          <FaCircle
            className={cssClasses('AbnormalBarChart__Message__Icon--normal')}
          />
        )}
        <span className={cssClasses('AbnormalBarChart__Message__Text')}>
          {item.get('message') ||
            intl.formatMessage(
              messages[item.get('messageI18nKey')],
              item.get('messageData').toJS()
            )}
        </span>
      </div>
    )
  )

export default enhance(AbnormalBarChart)
