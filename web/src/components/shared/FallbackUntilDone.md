### Usage

```js
import { FallbackUntilDone } from 'src/components/shared/FallbackUntilDone'
```

The FallbackUntilDone component uses fallbacks to render its child components. Each fallback is iterated through until its isDone function returns a true result, at which point the component is rendered according to the corresponding fallback.

### Variations
Fallback with div
```
<FallbackUntilDone
  fallbacks={[
    { style: { width: '100px' } },
    { style: { width: '200px' } },
    { style: { width: '300px' } },
  ]}
  isDone={node => node.getBoundingClientRect().width >= 400}
>
<div>Div Text</div>
</FallbackUntilDone>
```

Fallback with text fields
```
<FallbackUntilDone
  fallbacks={[
    {
      className: ('FallbackUntilDone--xs'),
    },
    {
      className: ('FallbackUntilDone--sm'),
    },
    {
      className: ('FallbackUntilDone--md'),
    },
  ]}
  isDone={node => node.getBoundingClientRect().width >= 400}

>
<div className={'Control'}>
  <FocusBlurTextField
    name="patientOrResearchId"
    value={20}
    floatingLabelFixed
  />
</div>
<div className={'Control'}>
  <FocusBlurTextField
    name="sampleId"
    value={30}
  />
</div>
<div className={'Control'}>
  <FocusBlurTextField
    name="sampleGroup"
    value={40}
  />
</div>
</FallbackUntilDone>
```