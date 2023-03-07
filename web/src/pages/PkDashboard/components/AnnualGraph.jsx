import React from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import EmptyGraph from '../../../components/Graphs/EmptyData'
import SimpleBarGraph from '../../../components/Graphs/SimpleBarGraph'
import styles from '../../../oldPages/dashboard/Graphs/styles.css'

const cssClasses = classnames.bind(styles)

const graphData = [
  {
    year: '2019',
    Annual: 3500,
  },
  {
    year: '2020',
    Annual: 1200,
  },
  {
    year: '2021',
    Annual: 800,
  },
  {
    year: '2023',
    Annual: 2400,
  },
]

const keys = ['Annual']

const AnnualGraph = ({ showLabel }) => {
  return (
    <Grid item xs={12} md={4} lg={4} sx={{ p: 1 }}>
      <div className={cssClasses('Graph_Wrapper')}>
        {graphData && !isEmpty(graphData) ? (
          <SimpleBarGraph data={graphData} keys={keys} indexBy="year" enableLabel={showLabel} />
        ) : (
          <EmptyGraph type="bar" />
        )}
      </div>
    </Grid>
  )
}

export default AnnualGraph
