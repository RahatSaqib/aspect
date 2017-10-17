import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = _.identity

export const SummaryItemsBlock = ({ intl, title, items, ...restProps }) => (
  <div
    {...restProps}
    className={cssClasses('SummaryItemsBlock', {
      'SummaryItemsBlock--clickable': _.isFunction(restProps.onClick),
    })}
  >
    <div className={cssClasses('SummaryItemsBlock__Title')}>{title}</div>
    <ul className={cssClasses('SummaryItemsBlock__Items')}>
      {_.map(items, it => (
        <li key={it.key} className={cssClasses('SummaryItemsBlock__Item')}>
          <div className={cssClasses('SummaryItemsBlock__Item__Count')}>
            {it.count}
          </div>
          <div className={cssClasses('SummaryItemsBlock__Item__Messages')}>
            <div>{intl.formatMessage(messages[it.titleI18nKey], it)}</div>
            <div
              className={cssClasses('SummaryItemsBlock__Item__Messages--sub')}
            >
              {it.subI18nKey && intl.formatMessage(messages[it.subI18nKey], it)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
)

export default enhance(SummaryItemsBlock)
