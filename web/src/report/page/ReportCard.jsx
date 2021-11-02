import React from 'react'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import messages from './messages'
import useI18n from '../../Hooks/i18n/useI18n'

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

const ReportCard = ({
  description,
  onClick,
  title,
  i18nKey,
  i18nKeyDescription,
}) => {
  const { formatMessage } = useI18n()
  return (
    <Grid item xs={12} sm={6} lg={3} style={{ padding: 8 }}>
      <Card style={styles.formatCard}>
        <CardActionArea onClick={() => onClick('xlsx')}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="h4">
              {messages[i18nKey] ? formatMessage(messages[i18nKey]) : title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {messages[i18nKeyDescription]
                ? formatMessage(messages[i18nKeyDescription])
                : description}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions style={styles.actions}>
          <Button size="small" color="primary" onClick={() => onClick('xlsx')}>
            Excel
          </Button>
          <Button size="small" color="primary" onClick={() => onClick('csv')}>
            CSV
          </Button>
        </CardActions>
      </Card>
    </Grid>
  )
}

export default ReportCard
