import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import AspectVertMenu from '../../../../components/AspectVertMenu'

const InstrumentContextualMenu = ({ instrument, onMoveToExisting, onMoveToNew }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const actions = [
    {
      icon: 'FaExchangeAlt',
      text: 'Move to an existing Device',
      action: () => {
        setMenuOpen(false)
        onMoveToExisting(instrument)
      },
    },
    {
      icon: 'FaPlus',
      text: 'Move to a new Device',
      action: () => {
        setMenuOpen(false)
        onMoveToNew(instrument)
      },
    },
  ]

  return (
    <Fragment>
      <AspectVertMenu actions={actions} open={menuOpen} setOpen={setMenuOpen} />
    </Fragment>
  )
}

InstrumentContextualMenu.propTypes = {
  instrument: PropTypes.object.isRequired,
  onMoveToExisting: PropTypes.func.isRequired,
  onMoveToNew: PropTypes.func.isRequired,
}

export default InstrumentContextualMenu
