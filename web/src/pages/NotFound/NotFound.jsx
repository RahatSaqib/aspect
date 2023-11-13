import React from 'react'
import ActionHome from '@mui/icons-material/Home'
import ActionBack from '@mui/icons-material/KeyboardArrowLeft'
import { IconButton } from '@mui/material'
import { Helmet } from 'react-helmet'
import { Link, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import messages from './messages'
import styles from './NotFound.module.css'

const NotFound = () => {
  const navigate = useNavigate()
  const { formatMessage } = useI18n()

  return (
    <div className={styles.Container}>
      <Helmet title={formatMessage(messages.title)} />
      <h1 className={styles.Container__Title}>{formatMessage(messages.title)}</h1>
      <h2 className={styles.Container__HelpBlock}>{formatMessage(messages.help)}</h2>
      <IconButton className={styles.Container__Button} onClick={() => navigate(-1)}>
        <ActionBack fontSize="large" />
      </IconButton>
      <Link to="/">
        <IconButton className={styles.Container__Button}>
          <ActionHome fontSize="large" />
        </IconButton>
      </Link>
    </div>
  )
}

export default NotFound
