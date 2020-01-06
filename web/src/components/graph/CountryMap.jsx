import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import { compose, pure, lifecycle } from 'recompose'
import { Mercator } from '@vx/geo'
import { Group } from '@vx/group'
import { MdCloudDownload } from 'react-icons/md'
import { feature } from 'topojson-client'

const cssClasses = classnames.bind(require('./CountryMap.css'))

const propTypes = {
  /**
ISO Alpha-2 Country Code. Eg. "US"
  */
  countryIsoAlpha2Code: PropTypes.string.isRequired,
  /**
extent is an array that'll be passed into d3-geo/projection.fitExtent method.
Usually it's an array like this:

```js
[
  [margin.left, margin.top],
  [clientWidth - margin.right, clientHeight - margin.bottom],
]
```

@see See [d3-geo/projection.fitExtent](https://github.com/d3/d3-geo#projection_fitExtent)
   */
  extent: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  fill: PropTypes.func.isRequired,
  stroke: PropTypes.func.isRequired,
  projectionFunc: PropTypes.func.isRequired,
  transform: PropTypes.string,
}

const defaultProps = {
  transform: '',
}

const enhance = compose(
  pure,
  lifecycle({
    componentWillMount() {
      this.handleLoad(this.props.countryIsoAlpha2Code)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.countryIsoAlpha2Code === nextProps.countryIsoAlpha2Code) {
        return
      }
      this.handleLoad(nextProps.countryIsoAlpha2Code)
    },

    handleLoad(countryIsoAlpha2Code) {
      this.setState({ loading: true, countryIsoAlpha2Code })
      import(`../../../map/topo/${countryIsoAlpha2Code}.json`)
        .then(topojson => state => {
          if (state.countryIsoAlpha2Code === countryIsoAlpha2Code) {
            return {
              loading: false,
              topojson,
            }
          }
        })
        .then(_.bind(this.setState, this))
    },
  })
)

/**
Renders a country map with internal borders specified by `countryIsoAlpha2Code`
 and fit with `extent`. The country data is asynchronously loaded and it shows a
 download icon when loading.
 All other props are delegated to the underlying `@vx/geo/Mercator` component.

@see [@vx/geo/Mercator](https://vx-demo.now.sh/static/docs/vx-geo.html)
*/
export const CountryMap = ({
  countryIsoAlpha2Code,
  extent,
  loading, // eslint-disable-line react/prop-types
  topojson, // eslint-disable-line react/prop-types
  fill,
  stroke,
  projectionFunc,
  transform,
  ...restProps
}) => {
  if (loading) {
    return (
      <Group className={cssClasses('Loading')}>
        <MdCloudDownload x="50%" y="50%" />
      </Group>
    )
  }

  // eslint-disable-next-line react/prop-types
  const geojson = feature(topojson, topojson.objects[countryIsoAlpha2Code])

  return (
    <Mercator
      data={geojson.features}
      fitExtent={[extent, geojson]}
      {...restProps}
    >
      {mercator => {
        const currProjection = _.get(mercator, ['features', 0, 'projection'])
        return (
          <Fragment>
            <g transform={transform}>
              {mercator.features.map((feature, i) => {
                const { feature: f } = feature
                return (
                  <path
                    // eslint-disable-next-line react/no-array-index-key
                    key={`map-feature-${i}`}
                    d={mercator.path(f)}
                    fill={fill(f)}
                    stroke={stroke()}
                    strokeWidth={0.5}
                  />
                )
              })}
              {currProjection &&
                projectionFunc &&
                projectionFunc(currProjection)}
            </g>
          </Fragment>
        )
      }}
    </Mercator>
  )
}

CountryMap.propTypes = propTypes
CountryMap.defaultProps = defaultProps

export default enhance(CountryMap)
