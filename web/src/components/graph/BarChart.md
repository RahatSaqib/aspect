### Usage

```js
import { ChartContainer } from 'src/components/graph/ChartContainer'
import { BarChart } from 'src/components/graph/BarChart'
```

It's themed according to default settings, requiring only data to render. Data should be defined as follows, with each value of the data array representing a single color on the stacked bar:

```js
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

Primary 4-Stack Bar Chart

```
<ChartContainer title="Test Failures Last 30 Days">
    <BarChart
        data={exData3}
        color={['#e85163', '#fcb026', '#73d449', '#25c5e0']}
        spacing={0.3}
        numLabelSize={30}
        styleWide
        hideAxes
        xOnly
    />
</ChartContainer>
```

Primary 2-Stack Bar Chart

```
<ChartContainer title="HIV">
    <BarChart
        data={[
            { name: 'Site1', data: [8, 1.5] },
            { name: 'Site2', data: [7, 0.5] },
            { name: 'Site3', data: [3, 2] },
            { name: 'Site4', data: [4, 1] },
            { name: 'Site5', data: [6, 2] },
            { name: 'Site6', data: [8, 1] },
            { name: 'Site7', data: [9, 2] },
            { name: 'newSite8', data: [6, 2] },
            { name: 'newSite1', data: [4, 1] },
            { name: 'newSite2', data: [7, 0.6] },
            { name: 'newSite3', data: [9, 2] },
            { name: 'newSite4', data: [7, 1] },
            { name: 'newSite5', data: [6, 1.5] },
            { name: 'newSite6', data: [4, 1] },
            { name: 'newSite7', data: [9, 1] },
            { name: 'newSite8', data: [8, 2] },
        ]}
        color={['#27c4e0', '#e85065']}
        spacing={0.3}
        numLabelSize={30}
    />
</ChartContainer>
```

Primary 2-Color Bar Chart

```
<ChartContainer title="Stock Outs" bottomTitle>
    <BarChart
        data={[
            { name: 'Site1', data: [8] },
            { name: 'Site2', data: [7] },
            { name: 'Site3', data: [3] },
            { name: 'Site4', data: [4] },
            { name: 'Site5', data: [6] },
            { name: 'Site6', data: [8] },
            { name: 'Site7', data: [9] },
            { name: 'newSite8', data: [0, 8] },
            { name: 'newSite1', data: [4] },
            { name: 'newSite2', data: [0, 5] },
            { name: 'newSite3', data: [9] },
            { name: 'newSite4', data: [7] },
            { name: 'newSite5', data: [6.5] },
            { name: 'newSite6', data: [4] },
            { name: 'newSite7', data: [6] },
            { name: 'newSite8', data: [3] },
        ]}
        color={['#4ddcd7', '#e65265']}
        spacing={0.3}
        numLabelSize={30}
        numYTicks={2}
    />
</ChartContainer>
```

Primary 3-Color Bar Chart

```
<ChartContainer title="Best and Worst Performing Sites">
    <BarChart
      data={exData4}
      color={['#e85163', '#a8e6f2', '#73d449']}
      spacing={0.3}
      numLabelSize={30}
      styleWide
      hideAxes
      xOnly
    />
</ChartContainer>
```

### Overrides

A BarChart can be designed in nearly any style, by changing the value of any of the following props:


data
color (['#3cc0cd', '#7d97bc', '#9874b2', '#f36283'])
hideLabel (true)
hideTicks (true)
hideAxes (false)
spacing (0.4)
numLabelSize (18)
styleWide (false)
xOnly (false)
