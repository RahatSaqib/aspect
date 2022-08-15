import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@mui/material/Card'
import orderBy from 'lodash/orderBy'

import { Unit } from '../../oldComponents/pureGrids'
import { AspectWidget } from './Widget'
import messages from './messages'

import styles from './Widgets.css'
import useI18n from '../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const OrderedAspectWidget = ({ items }) =>
  orderBy(items, item => item?.alert?.display || '', ['desc']).map(widget => (
    <AspectWidget data={widget} key={widget.id} />
  ))

const AspectWidgetGroup = ({ data }) => {
  const { formatMessage: intlFormatMessage } = useI18n()
  return (
    <Card className={cssClasses('summary__groupCard')}>
      {data.map(({ groupI18nKey, items }) => (
        <Unit key={groupI18nKey} sm="1-2" lg="1-4" className={cssClasses('summary__groupWrapper')}>
          <div className={cssClasses('summary__groupContainer')}>
            <div className={cssClasses('summary__groupTitle')}>{intlFormatMessage(messages[groupI18nKey])}</div>
            <div className={cssClasses('summary__groupWidgets')}>
              <OrderedAspectWidget items={items} />
            </div>
          </div>
        </Unit>
      ))}
    </Card>
  )
}

AspectWidgetGroup.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default AspectWidgetGroup
