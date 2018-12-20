### Usage

```js static
import { Button } from 'react-toolbox/lib/button'
```

It's already themed by `context`, where you can think it's defined like this:

```css
.button {
  ……
  composes: button from 'react-toolbox/lib/button/theme.module.css';
  composes: button from 'src/components/themedReactToolbox/Button.css';
  ……
}
```

### Variations

* primary/accent(/neutral)
* raised(/flat)

#### Neutral

Neutral Flat

```
<Button
  label="Button Label"
/>
```

Neutral Raised

```
<Button
  raised
  label="Button Label"
/>
```

#### Primary

Primary Flat

```
<div style={{backgroundColor: '#ddd', margin: -16, padding: 16}}>
  <Button
    primary
    label="Button Label"
  />
</div>
```

Primary Flat Inverse

```
<Button
  primary
  inverse
  label="Button Label"
/>
```

Primary Raised

```
<Button
  primary
  raised
  label="Button Label"
/>
```

Primary Raised Inverse

```
<div style={{backgroundColor: '#ddd', margin: -16, padding: 16}}>
  <Button
    primary
    raised
    inverse
    label="Button Label"
  />
</div>
```

#### Accent

Accent Flat

```
<Button
  accent
  label="Button Label"
/>
```

Accent Raised

```
<Button
  accent
  raised
  label="Button Label"
/>
```


### Overrides

First, you have to override the class names with specific class names. Check the source code or check the rendered HTML.
Then, overrides with these class names:

```css
.Button--neutral:not([disabled]).Button--raised {
  background-color: #084431;
  color: #ffffaa;
}
```

To use it, pull it in via css modules and inject into `theme` props:


```
const cssClasses = require('classnames/bind').bind(require('./Button.example.css'));

<Button
  raised
  neutral
  label="Button Label"
  theme={{
    neutral: cssClasses('Button--neutral'),
    raised: cssClasses('Button--raised'),
  }}
/>
```
