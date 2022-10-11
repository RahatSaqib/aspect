import React from 'react'
import { Button, Card, CardActionArea, CardActions, CardContent, Grid, Typography } from '@mui/material'
import useI18n from '../../../hooks/useI18n'
import messages from '../../../messages/report'

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
  },
}

const ReportCard = ({ description, onClick, title, i18nKey, i18nKeyDescription, exportExcel, exportCsv }) => {
  const { formatMessage } = useI18n()
  const reportName = messages[i18nKey] ? formatMessage(messages[i18nKey]) : title

  return (
    <Grid item xs={12} sm={6} lg={3} style={{ padding: 8 }}>
      <Card style={styles.formatCard}>
        <CardActionArea onClick={() => onClick('xlsx')}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="h4">
              {reportName}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {messages[i18nKeyDescription] ? formatMessage(messages[i18nKeyDescription]) : description}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions style={styles.actions}>
          {exportExcel === 1 && (
            <Button size="small" color="primary" onClick={() => onClick('xlsx', reportName)}>
              Excel
            </Button>
          )}
          {exportCsv === 1 && (
            <Button size="small" color="primary" onClick={() => onClick('csv', reportName)}>
              CSV
            </Button>
          )}
        </CardActions>
      </Card>
    </Grid>
  )
}

export default ReportCard
