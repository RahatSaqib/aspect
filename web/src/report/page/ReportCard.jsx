import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  card: {
    margin: 16,
    // Use flex layout with column direction for components in the card
    // (CardContent and CardActions)
    display: 'flex',
    flexDirection: 'column',

    // Justify the content so that CardContent will always be at the top of the card,
    // and CardActions will be at the bottom
    justifyContent: 'space-between',
    minWidth: 200,
  },
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

const reportCardStyleless = ({ classes, description, onClick, title }) => {
  return (
    <Grid component={Card} xs className={classes.card}>
      <Card className={classes.formatCard}>
        <CardActionArea onClick={onClick}>
          <CardContent>
            <Typography gutterBottom variant="h6" component="h4">
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {description}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions className={classes.actions}>
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
const ReportCard = withStyles(styles)(reportCardStyleless)

export default ReportCard
