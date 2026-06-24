import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse, Stack } from '@mui/material'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import useFilterUpdate from '../../hooks/useFilterUpdate'
import useFilterValues from '../../hooks/useFilterValues'
import messages from '../../messages/FilterMessages'
import FilterButtons from './FilterContainer.Buttons'

const cardContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 1,
  p: '16px !important',
}

const FilterContainer = ({ children, state, setState, blocked, disabled }) => {
  const { formatMessage } = useIntl()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const filter = useFilterValues(location.pathname)
  const [addFilter, removeFilter] = useFilterUpdate()

  const toggleOpen = () => setExpanded(state => !state)

  const cancel = () => {
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
    <Card sx={{ mb: 1, position: 'relative' }}>
      {disabled ? (
        <Stack
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 1,
            cursor: 'not-allowed',
            opacity: 0.8,
            backgroundColor: 'grey.50',
          }}
        />
      ) : null}
      <CardContent sx={cardContentStyle}>
        <FilterButtons filters={filter} remove={remove} append={append} blocked={blocked} />
        <Button variant="contained" color="secondary" sx={{ m: 0.25, height: '36px' }} onClick={toggleOpen}>
          {expanded ? <MdArrowUpward /> : <MdArrowDownward />}
        </Button>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={cardContentStyle}>{children}</CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={cancel}>
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
