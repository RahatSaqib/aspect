import _ from 'lodash'
import React, { Component, createRef } from 'react'
import { ScaleSVG } from '@vx/responsive'
import { Group } from '@vx/group'
import { GlyphDot } from '@vx/glyph'
import { Zoom } from '@vx/zoom'
import { localPoint } from '@vx/event'
import Tooltip from '@material-ui/core/Tooltip'
import CountryMap from '../../components/graph/CountryMap'

const enhance = _.identity

const randomBlue = feature =>
  `#${feature.index % 10}${feature.index % 5}d${feature.index %
    7}e${feature.index % 10}`

class Map extends Component {
  constructor(props) {
    super(props)
    this.dragFlags = this.getDefaultDragFlags()
    this.isZoomMax = false
    this.rectRef = createRef()
  }

  componentDidMount() {
    document.addEventListener('touchmove', this.handleDocumentTouchMove, {
      passive: false,
    })

    if (this.rectRef) {
      this.rectRef.current.addEventListener('wheel', this.handleWheel, {
        passive: false,
      })
    }
  }

  componentWillUnmount() {
    document.removeEventListener('touchmove', this.handleDocumentTouchMove)

    if (this.rectRef) {
      this.rectRef.current.removeEventListener('wheel', this.handleWheel)
    }
  }

  getDefaultDragFlags = () => ({
    isDragStart: false,
    isDragMoving: false,
    isDragEnd: false,
    isClick: false,
  })

  handleDocumentTouchMove = event => {
    if (this.dragFlags.isDragStart && this.dragFlags.isDragMoving) {
      event.preventDefault()
    }
  }

  handleWheel = event => {
    const { zoom } = this.props
    zoom.handleWheel(event)
    this.isZoomMax = true
  }

  handleDragStart = event => {
    const { zoom } = this.props
    zoom.dragStart(event)
    this.dragFlags = {
      ...this.getDefaultDragFlags(),
      isDragStart: true,
    }
  }

  handleDragMove = event => {
    const { zoom } = this.props
    zoom.dragMove(event)
    this.dragFlags = {
      ...this.dragFlags,
      isDragMoving: true,
    }
  }

  handleDragEnd = event => {
    const { zoom } = this.props
    zoom.dragEnd(event)
    this.dragFlags = {
      ...this.dragFlags,
      isDragEnd: true,
    }

    // dragging behavior check (hack)
    window.setTimeout(() => {
      if (!this.dragFlags.isClick) {
        this.dragFlags = this.getDefaultDragFlags()
      }
    }, 100)
  }

  handleMouseLeave = () => {
    const { zoom } = this.props
    if (!zoom.isDragging) return
    zoom.dragEnd()
  }

  handleClick = event => {
    this.dragFlags = {
      ...this.dragFlags,
      isClick: true,
    }

    const { zoom } = this.props
    if (this.dragFlags.isDragStart && this.dragFlags.isDragMoving) {
      return
    }

    if (this.isZoomMax) {
      zoom.reset()
      this.isZoomMax = false
    } else {
      const point = localPoint(event)
      zoom.scale({ scaleX: scaleXMax, scaleY: scaleYMax, point })
      this.isZoomMax = true
    }
  }

  render() {
    const {
      zoom,
      fill,
      clientWidth,
      clientHeight,
      countryIsoAlpha2Code,
      margin,
      points,
      onMouseEnter,
      onMouseLeave,
    } = this.props

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div
        role="presentation"
        ref={this.rectRef}
        width={clientWidth}
        height={clientHeight}
        onTouchStart={this.handleDragStart}
        onTouchMove={this.handleDragMove}
        onTouchEnd={this.handleDragEnd}
        onMouseDown={this.handleDragStart}
        onMouseMove={this.handleDragMove}
        onMouseUp={this.handleDragEnd}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
      >
        <ScaleSVG width={clientWidth} height={clientHeight}>
          <CountryMap
            transform={zoom.toString()}
            countryIsoAlpha2Code={countryIsoAlpha2Code}
            extent={[
              [margin.left, margin.top],
              [clientWidth - margin.right, clientHeight - margin.bottom],
            ]}
            projectionFunc={projection => (
              <Group>
                {points
                  .filter(
                    ({ longitude, latitude }) =>
                      _.isFinite(longitude) && _.isFinite(latitude)
                  )
                  .map(({ longitude, latitude, fill, size, id, siteName }) => {
                    const [left, top] = projection([longitude, latitude])
                    const isTooltipDisabled = _.isNil(siteName)

                    return (
                      <Tooltip
                        title={siteName}
                        aria-label={siteName}
                        disableFocusListener={isTooltipDisabled}
                        disableHoverListener={isTooltipDisabled}
                        disableTouchListener={isTooltipDisabled}
                      >
                        <GlyphDot
                          key={`point-${id}`}
                          data-point-id={id}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          cx={left}
                          cy={top}
                          r={size}
                          onMouseEnter={onMouseEnter}
                          onMouseLeave={onMouseLeave}
                        />
                      </Tooltip>
                    )
                  })}
              </Group>
            )}
            fill={fill}
            stroke={_.constant('#ffffff')}
          />
        </ScaleSVG>
      </div>
    )
  }
}

const initialTransform = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  skewX: 0,
  skewY: 0,
}

const scaleXMax = 3.5
const scaleYMax = 3.5

function lockBodyScroll(event) {
  event.preventDefault()
  document.body.style.overflow = 'hidden'
  document.body.style.webkitOverflowScrolling = 'touch'
  document.documentElement.style.overflow = 'hidden'
}

function releaseBodyScroll() {
  document.body.style.overflow = 'auto'
  document.documentElement.style.overflow = 'auto'
}

const CountryWithPoints = ({
  clientWidth = 300,
  clientHeight = 300,
  countryIsoAlpha2Code,
  fill = randomBlue,
  points = [],
  onMouseEnterPoint = _.noop,
  onMouseLeavePoint = _.noop,
  margin: rawMargin = {},
}) => {
  const margin = _.assign(
    {},
    { top: 10, bottom: 10, left: 10, right: 10 },
    rawMargin
  )

  const onMouseEnter = ({ target: { dataset: { pointId } } }) => {
    onMouseEnterPoint(pointId)
  }

  const onMouseLeave = ({ target: { dataset: { pointId } } }) => {
    onMouseLeavePoint(pointId)
  }

  return (
    // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
    <div
      onMouseOver={lockBodyScroll}
      onMouseOut={releaseBodyScroll}
      onTouchStart={lockBodyScroll}
      onTouchEnd={releaseBodyScroll}
    >
      <Zoom
        width={clientWidth}
        height={clientHeight}
        scaleXMin={1}
        scaleXMax={scaleXMax}
        scaleYMin={1}
        scaleYMax={scaleYMax}
        transformMatrix={initialTransform}
      >
        {zoom => (
          <Map
            zoom={zoom}
            fill={fill}
            clientWidth={clientWidth}
            clientHeight={clientHeight}
            countryIsoAlpha2Code={countryIsoAlpha2Code}
            margin={margin}
            points={points}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )}
      </Zoom>
    </div>
  )
}

export default enhance(CountryWithPoints)
