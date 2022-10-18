import React from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import classnames from 'classnames'

const Loading = ({ className }) => (
  <div className={classnames({ [className]: !!className })}>
    <CircularProgress />
  </div>
)

export default Loading
