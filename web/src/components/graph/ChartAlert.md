### Usage

```js
import ChartAlert from 'src/components/graph/ChartAlert'
```

This component renders an alert, which has a colored image (needs to be created in its own component, for now it's just a colored circle) and a message string. It is normally used as an add-on to a chart component (see ChartContainer for details).

### Variations
Red Alert (default)
```
<Alert status='red' statusString='This is a red alert' />
```

Amber Alert
```
<Alert status='amber' statusString='This is an amber alert' />
```

Green Alert
```
<Alert status='green' statusString='This is a green alert' />
```