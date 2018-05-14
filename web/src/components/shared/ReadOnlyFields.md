### Usage

```js static
import ReadOnlyFields from 'src/components/shared/ReadOnlyFields'
```

The ReadOnlyField component creates a list of read-only style fields container, which includes both a label and a value in a field.

### Variations

Standard Multi-fields Container

```
<ReadOnlyFields fields={[{label: 'Name', value: 'hello'}, {label: 'API Key', value: 'goodbye'}]} />
```

Large Multi-fields Container

```
<ReadOnlyFields fields={[{lg: true, label: 'Name', value: 'hello'}, {lg: true, label: 'API Key', value: 'goodbye'}]} />
```
