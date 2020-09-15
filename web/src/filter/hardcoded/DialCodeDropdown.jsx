import keyBy from 'lodash/keyBy'
import classnames from 'classnames/bind'
import React, { useRef } from 'react'
import Downshift from 'downshift'
import MenuItem from '@material-ui/core/MenuItem'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import Popper from '@material-ui/core/Popper'
import Paper from '@material-ui/core/Paper'
import RootRef from '@material-ui/core/RootRef'
import { List as VirtualList } from 'react-virtualized'

import FlagIcon from '../../components/shared/flagIcon/FlagIcon'
import countries from './countries'
import dialCodes from './dialCodes'

const cssClasses = classnames.bind(require('./DialCodeDropdown.css'))

const countryBy = keyBy(countries, 'isoAlpha2Code')

const dialCodesWithCountry = dialCodes.map(({ dialCode, isoAlpha2Code }) => ({
  isoAlpha2Code,
  dialCode,
  countryName: countryBy[isoAlpha2Code].name,
}))

const renderInput = ({
  selectedItem,
  inputProps,
  toggleButtonProps: { onClick },
}) => (
  <Input
    readOnly
    className={cssClasses('Dropdown')}
    inputProps={{
      className: cssClasses('Dropdown__Input'),
    }}
    {...inputProps}
    onClick={onClick}
    startAdornment={
      <InputAdornment position="start">
        {selectedItem && (
          <FlagIcon
            withRightMargin
            countryIsoAlpha2Code={selectedItem.isoAlpha2Code}
          />
        )}
      </InputAdornment>
    }
    endAdornment={
      <InputAdornment position="end">
        <ArrowDropDownIcon className={cssClasses('Dropdown__Icon')} />
      </InputAdornment>
    }
  />
)

const renderMenuItem = ({ index, style, key, getItemProps, selectedItem }) => {
  const item = dialCodesWithCountry[index]
  const { dialCode, isoAlpha2Code, countryName } = item
  const itemProps = getItemProps({ item })
  const isSelected = selectedItem === item

  return (
    <MenuItem
      key={key}
      value={dialCode}
      style={style}
      selected={isSelected}
      {...itemProps}
    >
      <FlagIcon withRightMargin isoAlpha2Code={isoAlpha2Code} />
      <span>
        {countryName} ({dialCode})
      </span>
    </MenuItem>
  )
}

const itemToString = item => (item ? item.dialCode : '')

export const DialCodeDropdown = ({ className, ...props }) => {
  const popperNode = useRef(null)
  const initialDialcode =
    props.value.length > 0 && props.value.length < 6 ? props.value : ''

  return (
    <Downshift
      itemToString={itemToString}
      {...props}
      initialInputValue={initialDialcode}
    >
      {({
        getInputProps,
        getToggleButtonProps,
        getItemProps,
        getMenuProps,
        isOpen,
        selectedItem,
      }) => (
        <div>
          <RootRef rootRef={popperNode}>
            {renderInput({
              ref: popperNode,
              selectedItem,
              inputProps: getInputProps({}),
              toggleButtonProps: getToggleButtonProps({}),
            })}
          </RootRef>
          <Popper
            open={isOpen}
            anchorEl={popperNode.current}
            transition
            popperOptions={{ placement: 'bottom-start' }}
          >
            <div
              {...(isOpen ? getMenuProps({}, { suppressRefError: true }) : {})}
            >
              {isOpen ? (
                <Paper
                  square
                  style={{
                    minWidth: popperNode
                      ? popperNode.current.clientWidth
                      : null,
                  }}
                >
                  <VirtualList
                    width={popperNode ? popperNode.current.clientWidth : 256}
                    height={
                      dialCodesWithCountry.length < 10
                        ? 32 * dialCodesWithCountry.length
                        : 32 * 10
                    }
                    rowCount={dialCodesWithCountry.length}
                    rowHeight={32}
                    rowRenderer={({ index, style, key }) =>
                      renderMenuItem({
                        index,
                        style,
                        key,
                        getItemProps,
                        selectedItem,
                      })
                    }
                  />
                </Paper>
              ) : null}
            </div>
          </Popper>
        </div>
      )}
    </Downshift>
  )
}

export default DialCodeDropdown
