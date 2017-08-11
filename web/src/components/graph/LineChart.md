### Usage

```js
import ChartContainer from 'src/components/graph/ChartContainer'
import LineChart from 'src/components/graph/LineChart'
```

It's themed according to default settings, requiring only data to render. Data should be defined as follows, with each value of the data array representing a line (all value[0] data are points on one line, all value[1] data are points on another line):

```js
const lineData2 = [
  { date: "Site 1", value: [1, 2, 8]},
  { date: "Site 2", value: [2, 4, 9]},
  { date: "Site 3", value: [3, 4, 8]},
  { date: "Site 4", value: [1, 4, 7]},
  { date: "Site 5", value: [2, 1, 2]},
  { date: "Site 6", value: [3, 4, 3]},
  { date: "Site 7", value: [1, 1, 5]},
  { date: "Site 8", value: [2, 3, 8]},
];
```

### Variations

Primary 2-Line Line Chart

```
<ChartContainer title="Title" >
    <LineChart
      data={[
        { date: 'Site 1', value: [1, 2, 8] },
        { date: 'Site 2', value: [2, 4, 9] },
        { date: 'Site 3', value: [3, 9, 8] },
        { date: 'Site 4', value: [1, 4, 7] },
        { date: 'Site 5', value: [2, 1, 6] },
        { date: 'Site 6', value: [3, 4, 5] },
        { date: 'Site 7', value: [1, 1, 5] },
        { date: 'Site 8', value: [2, 3, 8] },
      ]}
      hideLabel={false}
    />
</ChartContainer>
```

Primary 2-Line Error Chart (with Average)

```
```

### Customization

A LineChart can be designed in nearly any style, by changing the value of any of its props. If color is not specified, it is based off of the following array: ['#7d97bc', '#9874b2', '#3cc0cd', '#f36283'] 
