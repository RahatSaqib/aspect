### Usage

```js static
import { Overlay } from 'react-toolbox/lib/overlay'
```

It's already themed by `context`, where you can think it's defined like this:

```css
.overlay {
  ……
  composes: button from 'react-toolbox/lib/overlay/theme.module.css';
  composes: button from 'src/components/themedReactToolbox/Overlay.css';
  ……
}
```


### Overrides

First, you have to override the class names with specific class names. Check the source code or check the rendered HTML.
Then, overrides with these class names:

```css
.Overlay--overlay.Overlay--active {
  opacity: 0.7;
}
```

To use it, pull it in via css modules and inject into `theme` props:


```
const cssClasses = require('classnames/bind').bind(require('./Overlay.example.css'));

<Overlay
  active={false}
  theme={{
    overlay: cssClasses('Overlay--overlay'),
    active: cssClasses('Overlay--active'),
  }}
/>
```
