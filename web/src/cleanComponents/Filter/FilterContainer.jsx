import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse } from '@mui/material'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import messages from '../../messages/FilterMessages'
import { useFilterValues, useFilterUpdate } from '../../providers/FilterProvider'
import FilterButtons from './FilterContainer.Buttons'

const cardContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  p: '16px !important',
}

const FilterContainer = ({ children, state, setState }) => {
  const { formatMessage } = useI18n()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const filter = useFilterValues(location.pathname)
  const [addFilter, removeFilter] = useFilterUpdate()

  const toggleOpen = () => setExpanded(state => !state)

  const clear = () => {
    setState({ ...filter })
    toggleOpen()
  }

  const apply = () => {
    addFilter(state, location.pathname)
    toggleOpen()
  }

  const remove = keys => {
    removeFilter(keys, location.pathname)

    const newState = { ...state }
    keys.forEach(k => {
      if (k.includes('.')) {
        const [key, value] = k.split('.')
        newState[key] = newState[key].filter(v => v !== value)
      } else {
        delete newState[k]
      }
    })
    setState(newState)
  }

  const append = update => {
    const filters = { ...state, ...update }
    addFilter(filters, location.pathname)
    setState(filters)
  }

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={cardContentStyle}>
        <FilterButtons filters={filter} remove={remove} append={append} />
        <Button variant="contained" color="secondary" sx={{ m: 0.25, height: '36px' }} onClick={toggleOpen}>
          {expanded ? <MdArrowUpward /> : <MdArrowDownward />}
        </Button>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={cardContentStyle}>{children}</CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={clear}>
            {formatMessage(messages.cancel)}
          </Button>
          <Button size="small" onClick={apply}>
            {formatMessage(messages.apply)}
          </Button>
        </CardActions>
      </Collapse>
    </Card>
  )
}

export default FilterContainer
