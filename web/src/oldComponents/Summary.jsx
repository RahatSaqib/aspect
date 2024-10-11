import React from 'react'
import { Box } from '@mui/material'
import { FaExternalLinkAlt as FaExternalLink } from 'react-icons/fa'
import { useNavigate } from 'react-router'
import styles from './Summary.module.css'

const Summary = ({ title, description, to, action, cols = 1 }) => {
  const navigate = useNavigate()
  return (
    <Box sx={{ margin: '0 auto', width: `${100 / cols}%` }} className={styles.Summary}>
      <div className={styles.Summary__Title}>{title}</div>
      {Array.isArray(description) ? (
        description.map(item => {
          return (
            <div className={styles.Summary__Description} key={item.description}>
              {item.description}
              {item.to ? (
                <FaExternalLink onClick={() => navigate(item.to)} className={styles.Summary__Description__Link} />
              ) : null}
              {item.action && <span className={styles.Summary__Description__Action}>{item.action}</span>}
            </div>
          )
        })
      ) : (
        <div className={styles.Summary__Description}>
          {description}
          {to && <FaExternalLink onClick={() => to()} className={styles.Summary__Description__Link} />}
          {action && <span className={styles.Summary__Description__Action}>{action}</span>}
        </div>
      )}
    </Box>
  )
}

export default Summary
