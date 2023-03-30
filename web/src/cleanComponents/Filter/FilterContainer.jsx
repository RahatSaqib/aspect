import React, { useState } from 'react'
import { Button, Card, CardActions, CardContent, Collapse } from '@mui/material'
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md'
import { useLocation } from 'react-router'
import useI18n from '../../hooks/useI18n'
import messages from '../../messages/FilterMessages'
import { useAuthState } from '../../providers/AuthProvider'
import { useFilterValues, useFilterUpdate } from '../../providers/FilterProvider'
import FilterButtons from './FilterContainer.Buttons'

const cardContentStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }

const FilterContainer = ({ children }) => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const filter = useFilterValues(location.pathname)
  const [addFilter, removeFilter] = useFilterUpdate()
  const [state, setState] = useState({ ...filter, countryId: user.countryId })

  const toggleOpen = () => setExpanded(state => !state)

  const clear = () => {
    setState({ ...filter })
    toggleOpen()
  }

  const apply = () => {
    addFilter(state, location.pathname)
    toggleOpen()
  }

  const remove = key => removeFilter(key, location.pathname)

  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={cardContentStyle}>
        <FilterButtons filters={filter} remove={remove} />
        <Button variant="contained" sx={{ m: 0.25, height: '36px' }} onClick={toggleOpen}>
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
