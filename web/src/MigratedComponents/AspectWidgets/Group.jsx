import React from 'react'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import Card from '@material-ui/core/Card'

import { Unit } from '../../components/pureGrids'
import Widget from './Widget'

import messages from './messages'

const cssClasses = classnames.bind(require('./Group.css'))

const AspectWidgetGroup = ({ data }) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  // console.log(data)

  return (
    <Card className={cssClasses('summary__groupCard')}>
      {data.map(group => {
        const { groupI18nKey, items } = group
        return (
          <Unit
            key={groupI18nKey}
            sm="1-2"
            lg="1-4"
            className={cssClasses('summary__groupWrapper')}
          >
            <div className={cssClasses('summary__groupContainer')}>
              <div className={cssClasses('summary__groupTitle')}>
                {intlFormatMessage(messages[groupI18nKey])}
                {/* <Widget {...{ intl, defaultMessages, widget }} /> */}
              </div>
              <div className={cssClasses('summary__groupWidgets')}>
                {items.map(widget => (
                  <Widget data={widget} />
                ))}
              </div>
            </div>
          </Unit>
        )
      })}
    </Card>
  )
}

export default AspectWidgetGroup
