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
    margin: 10,
    // Use flex layout with column direction for components in the card
    // (CardContent and CardActions)
    display: 'flex',
    flexDirection: 'column',

    // Justify the content so that CardContent will always be at the top of the card,
    // and CardActions will be at the bottom
    justifyContent: 'space-between',
  },
}

const reportCardStyleless = ({ classes, title, description, linkUrl }) => {
  // eslint-disable-next-line no-return-assign
  const downloadFunc = () => (window.location.href = linkUrl)
  return (
    <Grid component={Card} xs className={classes.card}>
      <Card>
        <CardActionArea onClick={downloadFunc}>
          <CardContent>
            <Typography gutterBottom variant="h5" component="h4">
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {description}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button size="small" color="primary" onClick={downloadFunc}>
            Download
          </Button>
        </CardActions>
      </Card>
    </Grid>
  )
}
const ReportCard = withStyles(styles)(reportCardStyleless)

export default ReportCard
