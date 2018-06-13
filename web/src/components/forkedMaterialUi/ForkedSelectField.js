/* eslint-disable */
/**
 * This component is a fork of material-ui/SelectField.
 *
 * Initially tracks: https://github.com/callemall/material-ui/blob/v0.16.0/src/SelectField/SelectField.js
 *
 * Please check this file again if we upgrade material-ui.
 *
 * Added support for tab event, focus support and open dropdown menu on focus.
 *
 * References:
 *   https://github.com/callemall/material-ui/blob/v0.16.0/src/TextField/TextField.js
 *   https://github.com/callemall/material-ui/blob/v0.16.0/src/DropDownMenu/DropDownMenu.js
 *   https://github.com/callemall/material-ui/pull/3583/files
 */
// Forked
import _ from 'lodash'
import raf from 'dom-helpers/util/requestAnimationFrame'
import { findDOMNode } from 'react-dom'
import keycode from 'keycode'
import PropTypes from 'prop-types'
// Original
import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import DropDownMenu from './ForkedDropDownMenu'

function getStyles(props) {
  return {
    label: {
      paddingLeft: 0,
      top: props.floatingLabelText ? 6 : -4,
    },
    icon: {
      right: 0,
      top: props.floatingLabelText ? 22 : 14,
    },
    hideDropDownUnderline: {
      borderTop: 'none',
    },
    dropDownMenu: {
      display: 'block',
    },
  }
}

class SelectField extends Component {
  static propTypes = {
    /**
     * If true, the width will automatically be set according to the
     * items inside the menu.
     * To control the width in CSS instead, leave this prop set to `false`.
     */
    autoWidth: PropTypes.bool,
    /**
     * The `MenuItem` elements to populate the select field with.
     * If the menu items have a `label` prop, that value will
     * represent the selected menu item in the rendered select field.
     */
    children: PropTypes.node,
    /**
     * If true, the select field will be disabled.
     */
    disabled: PropTypes.bool,
    /**
     * Override the inline-styles of the error element.
     */
    errorStyle: PropTypes.object,
    /**
     * The error content to display.
     */
    errorText: PropTypes.node,
    /**
     * If true, the floating label will float even when no value is selected.
     */
    floatingLabelFixed: PropTypes.bool,
    /**
     * Override the inline-styles of the floating label.
     */
    floatingLabelStyle: PropTypes.object,
    /**
     * The content of the floating label.
     */
    floatingLabelText: PropTypes.node,
    /**
     * If true, the select field will take up the full width of its container.
     */
    fullWidth: PropTypes.bool,
    /**
     * Override the inline-styles of the hint element.
     */
    hintStyle: PropTypes.object,
    /**
     * The hint content to display.
     */
    hintText: PropTypes.node,
    /**
     * Override the inline-styles of the icon element.
     */
    iconStyle: PropTypes.object,
    /**
     * The id prop for the text field.
     */
    id: PropTypes.string,
    /**
     * Override the label style when the select field is inactive.
     */
    labelStyle: PropTypes.object,
    /**
     * Override the default max-height of the underlying `DropDownMenu` element.
     */
    maxHeight: PropTypes.number,
    /**
     * Override the inline-styles of the underlying `DropDownMenu` element.
     */
    menuStyle: PropTypes.object,
    /** @ignore */
    onBlur: PropTypes.func,
    /**
     * Callback function fired when a menu item is selected.
     *
     * @param {object} event TouchTap event targeting the menu item
     * that was selected.
     * @param {number} key The index of the selected menu item.
     * @param {any} payload The `value` prop of the selected menu item.
     */
    onChange: PropTypes.func,
    /** @ignore */
    onFocus: PropTypes.func,
    /**
     * Override the inline-styles of the root element.
     */
    style: PropTypes.object,
    /**
     * Override the inline-styles of the underline element when the select
     * field is disabled.
     */
    underlineDisabledStyle: PropTypes.object,
    /**
     * Override the inline-styles of the underline element when the select field
     * is focused.
     */
    underlineFocusStyle: PropTypes.object,
    /**
     * Override the inline-styles of the underline element.
     */
    underlineStyle: PropTypes.object,
    /**
     * The value that is currently selected.
     */
    value: PropTypes.any,
  }

  static defaultProps = {
    autoWidth: false,
    disabled: false,
    fullWidth: false,
  }

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  handleTextFieldMount = textField => {
    // Forked
    this._textField = textField
  }

  handleKeyUp = event => {
    // Forked
    // When we got focused by a tab event and tabIndex is set,
    // we trigger focus method on the textField, causing dropDownMenu to open.
    if (!this.props.tabIndex || this.props.tabIndex < 0) {
      return
    }
    switch (keycode(event)) {
      case 'tab':
        if (!event.shiftKey) {
          this._textField.focus() // trigger event handler setup by DropDownMenu
        }
        break
      case 'enter':
        // When menu is closed and delayedTriggerFocusOnRootNode is called,
        // the root element should have focus state.
        // This is the only time we open up the menu again.
        const root = findDOMNode(this._textField)
        if (root.contains(document.activeElement)) {
          this._textField.focus()
        }
        break
    }
  }

  handleChange = (...args) => {
    const { onChange = _.noop } = this.props
    onChange(...args)
    this.delayedTriggerFocusOnRootNode()
  }

  handleCloseFromEsc = () => {
    this.delayedTriggerFocusOnRootNode()
  }

  delayedTriggerFocusOnRootNode() {
    // When we got focused by a tab event and tabIndex is set,
    // we trigger focus method on the textField, causing dropDownMenu to open.
    if (!this.props.tabIndex || this.props.tabIndex < 0) {
      return
    }
    // this._textField.handleInputFocus();
    // Trigger focus on the root node in tick until the activeElement is dropDownRootNode
    // (it's the <div> element wraps the underlying dropDownMenu……etc)
    // It keeps the focus state (active underline style) below the SelectField element
    // but without the menu open.
    // Now user can use tab or tab+shift to navigate to/away the next/previous element.
    const endedAt = Date.now() + 5000
    const tick = () => {
      const dropDownMenu = this._textField.input // Private variable
      const dropDownRootNode = findDOMNode(dropDownMenu)
      // Don't call dropDownRootNode.focus() directly, it'll open the menu.
      // We just want DOM to focus on this element
      HTMLDivElement.prototype.focus.call(dropDownRootNode)
      if (Date.now() < endedAt && document.activeElement !== dropDownRootNode) {
        raf(tick)
      }
      // We need to use raf to call tick is because DOM rendering is asynchronous,
      // and we have no idea when will it settled.
    }
    raf(tick)
  }

  render() {
    const {
      autoWidth,
      children,
      style,
      labelStyle,
      iconStyle,
      id,
      underlineDisabledStyle,
      underlineFocusStyle,
      underlineStyle,
      errorStyle,
      disabled,
      floatingLabelFixed,
      floatingLabelText,
      floatingLabelStyle,
      hintStyle,
      hintText,
      fullWidth,
      errorText,
      maxHeight,
      menuStyle,
      onFocus,
      onBlur,
      onChange,
      value,
      tabIndex, // Forked
      ...other
    } = this.props

    const styles = getStyles(this.props, this.context)

    return (
      <TextField
        {...other}
        style={{
          ...style,
          // Forked
          outline: 'none',
        }}
        disabled={disabled}
        floatingLabelFixed={floatingLabelFixed}
        floatingLabelText={floatingLabelText}
        floatingLabelStyle={floatingLabelStyle}
        hintStyle={hintStyle}
        hintText={!hintText && !floatingLabelText ? ' ' : hintText}
        fullWidth={fullWidth}
        errorText={errorText}
        underlineStyle={underlineStyle}
        errorStyle={errorStyle}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        underlineDisabledStyle={underlineDisabledStyle}
        underlineFocusStyle={underlineFocusStyle}
        // Forked below
        ref={this.handleTextFieldMount}
        onKeyUp={this.handleKeyUp}
      >
        <DropDownMenu
          disabled={disabled}
          style={Object.assign(styles.dropDownMenu, menuStyle)}
          labelStyle={Object.assign(styles.label, labelStyle)}
          iconStyle={Object.assign(styles.icon, iconStyle)}
          underlineStyle={styles.hideDropDownUnderline}
          autoWidth={autoWidth}
          value={value}
          // onChange={onChange} Forked
          maxHeight={maxHeight}
          // Forked below
          onChange={this.handleChange}
          onCloseFromEsc={this.handleCloseFromEsc}
          tabIndex={tabIndex}
        >
          {children}
        </DropDownMenu>
      </TextField>
    )
  }
}

export default SelectField
