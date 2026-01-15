import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AspectVertMenu from '../../../../components/AspectVertMenu'
import messages from './messages'
import MoveToNewDeviceModal from './MoveToNewDeviceModal'

const InstrumentContextualMenu = ({ instrument, onMoveToExisting, onMoveToNew }) => {
  const { formatMessage } = useIntl()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const actions = [
    {
      icon: 'FaExchangeAlt',
      text: formatMessage(messages.moveToExistingDevice),
      action: () => {
        setMenuOpen(false)
        onMoveToExisting(instrument)
      },
    },
    {
      icon: 'FaPlus',
      text: formatMessage(messages.moveToNewDevice),
      action: () => {
        setMenuOpen(false)
        setModalOpen(true)
      },
    },
  ]

  const handleModalConfirm = formData => {
    setModalOpen(false)
    onMoveToNew({ ...instrument, ...formData })
  }

  return (
    <Fragment>
      <AspectVertMenu actions={actions} open={menuOpen} setOpen={setMenuOpen} />
      <MoveToNewDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
        instrumentSerial={instrument.instrumentSerial}
      />
    </Fragment>
  )
}

InstrumentContextualMenu.propTypes = {
  instrument: PropTypes.object.isRequired,
  onMoveToExisting: PropTypes.func.isRequired,
  onMoveToNew: PropTypes.func.isRequired,
}

export default InstrumentContextualMenu
