### Usage

```js
import { ReadOnlyField } from 'src/components/shared/ReadOnlyFields'
```

The ReadOnlyField component creates a read-only style field container, which includes both a label and a value.

### Variations

Standard Multi-field Container
```
<ReadOnlyField fields={[{label: 'Name', value: 'hello'}, {label: 'API Key', value: 'goodbye'}]} />
```

Standard Single-field Container
```
<ReadOnlyField fields={[{label: 'Name', value: 'hello'}]} />
```