### Usage

```js static
import { Checkbox } from 'react-toolbox/lib/checkbox'
```

It's already themed by `context`, where you can think it's defined like this:

```css
.check {
  ……
  composes: check from 'react-toolbox/lib/checkbox/theme.css';
  composes: check from 'src/components/themedReactToolbox/Checkbox.css';
  ……
}
```


### Variations

Unchecked

```
<Checkbox
  checked={false}
/>
```

Checked

```
<Checkbox
  checked={true}
/>
```


### Overrides

First, you have to override the class names with specific class names. Check the source code or check the rendered HTML.
Then, overrides with these class names:

```css
.Checkbox--check.Checkbox--checked {
  background-color: #aaaaaa;
}
```

To use it, pull it in via css modules and inject into `theme` props:


```
const cssClasses = require('classnames/bind').bind(require('./Checkbox.example.css'));

<Checkbox
  checked={false}
  theme={{
    check: cssClasses('Checkbox--check'),
    checked: cssClasses('Checkbox--checked'),
  }}
/>
```
