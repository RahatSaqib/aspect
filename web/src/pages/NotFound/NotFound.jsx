import classnames from 'classnames/bind'
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'

// Material-UI
import IconButton from '@mui/material/IconButton'
import ActionHome from '@mui/icons-material/Home'
import ActionBack from '@mui/icons-material/KeyboardArrowLeft'

import messages from './messages'
import styles from './NotFound.css'
import useI18n from '../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const NotFound = () => {
  const navigate = useNavigate()
  const { formatMessage } = useI18n()

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={formatMessage(messages.title)} />
      <h1 className={cssClasses('Container__Title')}>{formatMessage(messages.title)}</h1>
      <h2 className={cssClasses('Container__HelpBlock')}>{formatMessage(messages.help)}</h2>
      <IconButton className={cssClasses('Container__Button')} onClick={() => navigate(-1)}>
        <ActionBack fontSize="large" />
      </IconButton>
      <Link to="/">
        <IconButton className={cssClasses('Container__Button')}>
          <ActionHome fontSize="large" />
        </IconButton>
      </Link>
    </div>
  )
}

export default NotFound
