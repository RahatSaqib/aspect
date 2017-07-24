### Usage

```js
import { ReadOnlyField } from 'src/components/shared/ReadOnlyField'
```

The ReadOnlyFields component creates a read-only style field container, which includes both a label and a value.

### Variations
Standard Container
```
<ReadOnlyField label='label' value='value' />
```

Large Container
```
<ReadOnlyField label='label' value='value' lg={true}/>
```

### Props

Further customization of this component can be achieved by altering any of the following props: 

label: PropTypes.string.isRequired,  
value: PropTypes.any,  
lg: PropTypes.bool,  
format: PropTypes.func,  
nullText: PropTypes.string,  