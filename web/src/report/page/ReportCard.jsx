import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import { Unit } from '../../components/pureGrids'

const ReportCard = ({ className, title, description, linkUrl }) => {
  // eslint-disable-next-line no-return-assign
  const downloadFunc = () => (window.location.href = linkUrl)
  return (
    <Unit lg="1-4" style={{ height: '100%' }}>
      <Card className={className} style={{ margin: 10, height: '100%' }}>
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
          {/* 
          <Button size="small" color="primary">
          Share
        </Button> */}

          <Button size="small" color="primary" onClick={downloadFunc}>
            Download
          </Button>
        </CardActions>
      </Card>
    </Unit>
  )
}
export default ReportCard
