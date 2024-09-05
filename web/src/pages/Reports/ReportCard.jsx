import React from 'react'
import { Card, CardActionArea, CardActions, CardContent, Grid, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { report as messages } from '../../messages'

const styles = {
  formatCard: {
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    height: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
}

const ReportCard = ({ description, onClick, title, i18nKey, i18nKeyDescription, children }) => {
  const { formatMessage } = useIntl()
  const reportName = messages[i18nKey] ? formatMessage(messages[i18nKey]) : title
  return (
    <Grid item xs={12} sm={6} lg={3} style={{ padding: 8 }}>
      <Card style={styles.formatCard}>
        <CardActionArea onClick={onClick}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="h4">
              {reportName}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {messages[i18nKeyDescription] ? formatMessage(messages[i18nKeyDescription]) : description}
            </Typography>
          </CardContent>
        </CardActionArea>
        {children && <CardActions style={styles.actions}>{children}</CardActions>}
      </Card>
    </Grid>
  )
}

export default ReportCard
