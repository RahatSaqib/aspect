import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import ActionFilterIcon from './actionFilterIcon/ActionFilterIcon'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = _.identity

export const ActionFilterButton = ({
  intl,
  title,
  category,
  actions,
  selected,
  ...restProps
}) => {
  const actionCount = actions.filter(x => x.get('status') === 'Active').size
  return (
    <div
      {...restProps}
      className={cssClasses('ActionFilterButton', {
        'ActionFilterButton--selected': selected,
      })}
    >
      <div className={cssClasses('ActionFilterButton__Title')}>{title}</div>

      <ActionFilterIcon
        className={cssClasses('ActionFilterButton__Icon')}
        category={category}
        status={
          actions.some(x => x.get('status') === 'Active')
            ? 'active'
            : actions.some(x => x.get('status') === 'Acknowledged')
              ? 'acknowledged'
              : 'ok'
        }
      />

      <div
        className={cssClasses('ActionFilterButton__Messages', {
          'ActionFilterButton__Messages--hidden': actionCount === 0,
        })}
      >
        {intl.formatMessage(messages.actionCount, {
          actionCount,
        })}
      </div>
    </div>
  )
}
export default enhance(ActionFilterButton)
