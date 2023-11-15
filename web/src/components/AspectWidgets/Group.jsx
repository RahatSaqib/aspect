import React from 'react'
import { Card, Grid } from '@mui/material'
import orderBy from 'lodash/orderBy'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import messages from './messages'
import { AspectWidget } from './Widget'
import styles from './Widgets.module.css'

const OrderedAspectWidget = ({ items }) =>
  orderBy(items, item => item?.alert?.display || '', ['desc']).map(widget => (
    <AspectWidget data={widget} key={widget.id} />
  ))

const AspectWidgetGroup = ({ data }) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  return (
    <Card className={styles.summary__groupCard}>
      <Grid container spacing={2}>
        {data.map(({ groupI18nKey, items }) => (
          <Grid item sm={6} md={3} key={groupI18nKey} className={styles.summary__groupWrapper}>
            <div className={styles.summary__groupContainer}>
              <div className={styles.summary__groupTitle}>{intlFormatMessage(messages[groupI18nKey])}</div>
              <div className={styles.summary__groupWidgets}>
                <OrderedAspectWidget items={items} />
              </div>
            </div>
          </Grid>
        ))}
      </Grid>
    </Card>
  )
}

AspectWidgetGroup.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default AspectWidgetGroup
