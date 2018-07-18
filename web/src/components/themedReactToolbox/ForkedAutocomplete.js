/**
 * This component is a fork of react-toolbox/Autocomplete
 *
 * Initially tracks: https://github.com/react-toolbox/react-toolbox/blob/f75fd262070754c3346e50ef06f5e03d99049bbb/components/autocomplete/Autocomplete.js
 *
 * Please check this file again if we upgrade react-toolbox.
 *
 * Added support for
 * - Limit maximum number of tags allowed to be added
 * - tags is separated by comma
 * - tag is case insensitive
 */
/* eslint-disable */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { themr } from 'react-css-themr'
// Forked
import { AUTOCOMPLETE } from 'react-toolbox/lib/identifiers'
import { InjectInput } from 'react-toolbox/lib/input'
import { InjectChip } from 'react-toolbox/lib/chip'
import { events } from 'react-toolbox/lib/utils'

const POSITION = {
  AUTO: 'auto',
  DOWN: 'down',
  UP: 'up',
}

const factory = (Chip, Input) => {
  class Autocomplete extends Component {
    static propTypes = {
      allowCreate: PropTypes.bool,
      className: PropTypes.string,
      direction: PropTypes.oneOf(['auto', 'up', 'down']),
      disabled: PropTypes.bool,
      error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      keepFocusOnChange: PropTypes.bool,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      multiple: PropTypes.bool,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      onFocus: PropTypes.func,
      onKeyDown: PropTypes.func,
      onKeyUp: PropTypes.func,
      onQueryChange: PropTypes.func,
      query: PropTypes.string,
      selectedPosition: PropTypes.oneOf(['above', 'below', 'none']),
      showSelectedWhenNotInSource: PropTypes.bool,
      showSuggestionsWhenValueIsSet: PropTypes.bool,
      source: PropTypes.any,
      suggestionMatch: PropTypes.oneOf([
        'disabled',
        'start',
        'anywhere',
        'word',
        'none',
      ]),
      theme: PropTypes.shape({
        active: PropTypes.string,
        autocomplete: PropTypes.string,
        focus: PropTypes.string,
        input: PropTypes.string,
        suggestion: PropTypes.string,
        suggestions: PropTypes.string,
        up: PropTypes.string,
        value: PropTypes.string,
        values: PropTypes.string,
      }),
      value: PropTypes.any,
      // Forked, the max number of tags that are allowed to be added
      maxTags: PropTypes.number,
    }

    static defaultProps = {
      allowCreate: false,
      className: '',
      direction: 'auto',
      keepFocusOnChange: false,
      multiple: true,
      selectedPosition: 'above',
      showSelectedWhenNotInSource: false,
      showSuggestionsWhenValueIsSet: false,
      source: {},
      suggestionMatch: 'start',
      // Forked
      maxTags: 10,
    }

    state = {
      direction: this.props.direction,
      focus: false,
      showAllSuggestions: this.props.showSuggestionsWhenValueIsSet,
      query: this.props.query ? this.props.query : this.query(this.props.value),
      isValueAnObject: false,
    }

    componentWillReceiveProps(nextProps) {
      if (!this.props.multiple) {
        const query = nextProps.query
          ? nextProps.query
          : this.query(nextProps.value)
        this.updateQuery(query, false)
      }
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (
        !this.state.focus &&
        nextState.focus &&
        this.props.direction === POSITION.AUTO
      ) {
        const direction = this.calculateDirection()
        if (this.state.direction !== direction) {
          this.setState({ direction })
        }
      }
      return true
    }

    handleChange = (values, event) => {
      const value = this.props.multiple ? values : values[0]
      const { showSuggestionsWhenValueIsSet: showAllSuggestions } = this.props
      const query = this.query(value)
      if (this.props.onChange) this.props.onChange(value, event)
      if (this.props.keepFocusOnChange) {
        this.setState({ query, showAllSuggestions })
      } else {
        this.setState({ focus: false, query, showAllSuggestions }, () => {
          ReactDOM.findDOMNode(this)
            .querySelector('input')
            .blur()
        })
      }
      this.updateQuery(query, this.props.query)
    }

    handleMouseDown = event => {
      this.selectOrCreateActiveItem(event)
    }

    handleQueryBlur = event => {
      if (this.state.focus) this.setState({ focus: false })
      if (this.props.onBlur) this.props.onBlur(event, this.state.active)
    }

    updateQuery = (query, notify) => {
      if (notify && this.props.onQueryChange) this.props.onQueryChange(query)
      this.setState({ query })
    }

    handleQueryChange = value => {
      const query = this.clearQuery ? '' : value
      this.clearQuery = false

      this.updateQuery(query, true)
      this.setState({
        showAllSuggestions: query
          ? false
          : this.props.showSuggestionsWhenValueIsSet,
        active: null,
      })
    }

    handleQueryFocus = event => {
      event.target.scrollTop = 0
      this.setState({ active: '', focus: true })
      if (this.props.onFocus) this.props.onFocus(event)
    }

    handleQueryKeyDown = event => {
      // Mark query for clearing in handleQueryChange when pressing backspace and showing all suggestions.
      this.clearQuery =
        event.which === 8 &&
        this.props.showSuggestionsWhenValueIsSet &&
        this.state.showAllSuggestions

      // Forked, comma(188) trigger a new tag
      if (event.which === 13 || event.which === 188) {
        this.selectOrCreateActiveItem(event)
      }

      if (this.props.onKeyDown) this.props.onKeyDown(event)
    }

    handleQueryKeyUp = event => {
      if (event.which === 27)
        ReactDOM.findDOMNode(this)
          .querySelector('input')
          .blur()

      if ([40, 38].indexOf(event.which) !== -1) {
        const suggestionsKeys = [...this.suggestions().keys()]
        let index =
          suggestionsKeys.indexOf(this.state.active) +
          (event.which === 40 ? +1 : -1)
        if (index < 0) index = suggestionsKeys.length - 1
        if (index >= suggestionsKeys.length) index = 0
        this.setState({ active: suggestionsKeys[index] })
      }

      if (this.props.onKeyUp) this.props.onKeyUp(event)
    }

    handleSuggestionHover = event => {
      this.setState({ active: event.target.id })
    }

    calculateDirection() {
      if (this.props.direction === 'auto') {
        const client = ReactDOM.findDOMNode(
          this.inputNode
        ).getBoundingClientRect()
        const screen_height =
          window.innerHeight || document.documentElement.offsetHeight
        const up = client.top > screen_height / 2 + client.height
        return up ? 'up' : 'down'
      }
      return this.props.direction
    }

    query(key) {
      let query_value = ''
      if (!this.props.multiple && key) {
        const source_value = this.source().get(`${key}`)
        query_value = source_value || key
      }
      return query_value
    }

    selectOrCreateActiveItem(event) {
      let target = this.state.active
      if (!target) {
        target = this.props.allowCreate
          ? this.state.query
          : [...this.suggestions().keys()][0]
        this.setState({ active: target })
      }
      this.select(event, target)
    }

    normalise(value) {
      const sdiak =
        'áâäąáâäąččććççĉĉďđďđééěëēėęéěëēėęĝĝğğġġģģĥĥħħíîíîĩĩīīĭĭįįi̇ıĵĵķķĸĺĺļļŀŀłłĺľĺľňńņŋŋņňńŉóöôőøōōóöőôøřřŕŕŗŗššśśŝŝşşţţťťŧŧũũūūŭŭůůűűúüúüűųųŵŵýyŷŷýyžžźźżżß'
      const bdiak =
        'AAAAAAAACCCCCCCCDDDDEEEEEEEEEEEEEGGGGGGGGHHHHIIIIIIIIIIIIIIJJKKKLLLLLLLLLLLLNNNNNNNNNOOOOOOOOOOOORRRRRRSSSSSSSSTTTTTTUUUUUUUUUUUUUUUUUWWYYYYYYZZZZZZS'

      let normalised = ''
      for (let p = 0; p < value.length; p++) {
        if (sdiak.indexOf(value.charAt(p)) !== -1) {
          normalised += bdiak.charAt(sdiak.indexOf(value.charAt(p)))
        } else {
          normalised += value.charAt(p)
        }
      }

      return normalised.toLowerCase().trim()
    }

    suggestions() {
      let suggest = new Map()
      const rawQuery =
        this.state.query || (this.props.multiple ? '' : this.props.value)
      const query = this.normalise(`${rawQuery}`)
      const values = this.values()
      const source = this.source()

      // Suggest any non-set value which matches the query
      if (this.props.multiple) {
        for (const [key, value] of source) {
          if (!values.has(key) && this.matches(this.normalise(value), query)) {
            suggest.set(key, value)
          }
        }

        // When multiple is false, suggest any value which matches the query if showAllSuggestions is false
      } else if (query && !this.state.showAllSuggestions) {
        for (const [key, value] of source) {
          if (this.matches(this.normalise(value), query)) {
            suggest.set(key, value)
          }
        }

        // When multiple is false, suggest all values when showAllSuggestions is true
      } else {
        suggest = source
      }

      return suggest
    }

    matches(value, query) {
      const { suggestionMatch } = this.props

      if (suggestionMatch === 'disabled') {
        return true
      } else if (suggestionMatch === 'start') {
        return value.startsWith(query)
      } else if (suggestionMatch === 'anywhere') {
        return value.includes(query)
      } else if (suggestionMatch === 'word') {
        const re = new RegExp(`\\b${query}`, 'g')
        return re.test(value)
      } else if (suggestionMatch === 'none') {
        return value
      }

      return false
    }

    source() {
      const { source: src } = this.props
      if (src.hasOwnProperty('length')) {
        return new Map(
          src.map(item => (Array.isArray(item) ? [...item] : [item, item]))
        )
      }
      return new Map(Object.keys(src).map(key => [`${key}`, src[key]]))
    }

    values() {
      let vals = this.props.multiple ? this.props.value : [this.props.value]

      if (!vals) vals = []

      if (this.props.showSelectedWhenNotInSource && this.isValueAnObject()) {
        return new Map(Object.entries(vals))
      }
      // Forked
      const valueMap = new Map(
        vals.map(item => (Array.isArray(item) ? [...item] : [item, item]))
      )

      return valueMap
    }

    select = (event, target) => {
      events.pauseEvent(event)
      const values = this.values(this.props.value)
      const source = this.source()
      const newValue = target === void 0 ? event.target.id : target

      // Forked
      if (newValue && newValue.trim() === '') {
        return
      }
      // Forked
      if (this.props.maxTags > 0 && values.size >= this.props.maxTags) {
        return
      }

      if (this.isValueAnObject()) {
        const newItem = Array.from(source).reduce((obj, [k, value]) => {
          if (k === newValue) {
            obj[k] = value
          }
          return obj
        }, {})

        if (Object.keys(newItem).length === 0 && newValue) {
          newItem[newValue] = newValue
        }

        return this.handleChange(
          Object.assign(this.mapToObject(values), newItem),
          event
        )
      }
      // Forked
      const isExist = Array.from(values).some(
        ([k, val]) => val.toLowerCase() === newValue.toLowerCase()
      )
      const newItem = !isExist
        ? [...values.keys(), newValue]
        : [...values.keys()]
      this.handleChange(newItem, event)
    }

    unselect(key, event) {
      if (!this.props.disabled) {
        const values = this.values(this.props.value)

        values.delete(key)

        if (this.isValueAnObject()) {
          return this.handleChange(this.mapToObject(values), event)
        }

        this.handleChange([...values.keys()], event)
      }
    }

    isValueAnObject() {
      return (
        !Array.isArray(this.props.value) && typeof this.props.value === 'object'
      )
    }

    mapToObject(map) {
      return Array.from(map).reduce((obj, [k, value]) => {
        obj[k] = value
        return obj
      }, {})
    }

    renderSelected() {
      if (this.props.multiple) {
        const selectedItems = [...this.values()].map(([key, value]) => (
          <Chip
            key={key}
            className={this.props.theme.value}
            deletable
            onDeleteClick={this.unselect.bind(this, key)}
          >
            {value}
          </Chip>
        ))

        return <ul className={this.props.theme.values}>{selectedItems}</ul>
      }
    }

    renderSuggestions() {
      const { theme } = this.props
      const suggestions = [...this.suggestions()].map(([key, value]) => {
        const className = classnames(theme.suggestion, {
          [theme.active]: this.state.active === key,
        })
        return (
          <li
            id={key}
            key={key}
            className={className}
            onMouseDown={this.handleMouseDown}
            onMouseOver={this.handleSuggestionHover}
          >
            {value}
          </li>
        )
      })

      return (
        <ul
          className={classnames(theme.suggestions, {
            [theme.up]: this.state.direction === 'up',
          })}
        >
          {suggestions}
        </ul>
      )
    }

    render() {
      const {
        allowCreate,
        error,
        label,
        source,
        suggestionMatch,
        query, // eslint-disable-line no-unused-vars
        selectedPosition,
        keepFocusOnChange,
        showSuggestionsWhenValueIsSet,
        showSelectedWhenNotInSource,
        onQueryChange, // eslint-disable-line no-unused-vars
        theme,
        ...other
      } = this.props
      const className = classnames(
        theme.autocomplete,
        {
          // Forked
          [theme.focus]: this.state.focus && this.state.query,
        },
        this.props.className
      )

      return (
        <div data-react-toolbox="autocomplete" className={className}>
          {this.props.selectedPosition === 'above'
            ? this.renderSelected()
            : null}
          <Input
            {...other}
            ref={node => {
              this.inputNode = node
            }}
            autoComplete="off"
            className={theme.input}
            error={error}
            label={label}
            onBlur={this.handleQueryBlur}
            onChange={this.handleQueryChange}
            onFocus={this.handleQueryFocus}
            onKeyDown={this.handleQueryKeyDown}
            onKeyUp={this.handleQueryKeyUp}
            theme={theme}
            themeNamespace="input"
            value={this.state.query}
          />
          {this.renderSuggestions()}
          {this.props.selectedPosition === 'below'
            ? this.renderSelected()
            : null}
        </div>
      )
    }
  }

  return Autocomplete
}

const Autocomplete = factory(InjectChip, InjectInput)
export default themr(AUTOCOMPLETE, null, { withRef: true })(Autocomplete)
export { factory as autocompleteFactory }
export { Autocomplete }
