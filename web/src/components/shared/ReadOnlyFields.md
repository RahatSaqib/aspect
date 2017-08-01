### Usage

```js
import { ReadOnlyField, ReadOnlyFields } from 'src/components/shared/ReadOnlyFields'
```

The ReadOnlyFields component creates a read-only style field container, which includes both a label and a value.

### Variations

Standard ReadOnlyFields Container
```
<ReadOnlyFields fields={[{label: 'Name', value: 'hello'}, {label: 'API Key', value: 'goodbye'}]} />
```

Standard ReadOnlyField Container
```
<ReadOnlyField label={'Name'} value={'hello'}/>
```