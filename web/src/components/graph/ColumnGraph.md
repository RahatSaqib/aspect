### Usage

```js static
import ChartContainer from 'src/components/graph/ChartContainer'
import ColumnGraph from 'src/components/graph/ColumnGraph'
```

It's themed according to default settings, requiring only data to render. Data should be defined as follows, with each value of the data array representing a single color on the stacked bar:

```js static
const exData1 = [
  { name: 'Site name 1', data: [3, 4, 8] },
  { name: 'Site name 2', data: [1, 4, 7] },
  { name: 'Site name 3', data: [2, 5, 9] },
  { name: 'Site name 4', data: [4, 3, 10] },
  { name: 'Site name 5', data: [3, 4, 6] },
  { name: 'Site name 6', data: [1, 4, 10] },
  { name: 'Site name 7', data: [2, 5, 9] },
  { name: 'Site name 8', data: [4, 3, 8] },
]
```

### Variations

Primary 3-Stack Column Chart

```
<ChartContainer title="Title">
  <ColumnGraph
    data={[
      { name: 'Site name 1', data: [3, 4, 8] },
      { name: 'Site name 2', data: [1, 4, 7] },
      { name: 'Site name 3', data: [2, 5, 9] },
      { name: 'Site name 4', data: [4, 3, 10] },
      { name: 'Site name 5', data: [3, 4, 6] },
      { name: 'Site name 6', data: [1, 4, 10] },
      { name: 'Site name 7', data: [2, 5, 9] },
      { name: 'Site name 8', data: [4, 3, 8] },
    ]}
    color={['#e85164', '#fcb124', '#73d449']}
    spacing={0.4}
    hideAxes
    rightLabel
    hideLabel={false}
  />
</ChartContainer>
```

### Customization

A ColumnGraph can be designed in nearly any style, by changing the value of any of its props. If color is not specified, it is based off of the following array: ['#3cc0cd', '#7d97bc', '#9874b2', '#f36283']
