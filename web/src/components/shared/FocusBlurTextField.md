### Usage

```js
import FocusBlurTextField from 'src/components/shared/FocusBlurTextField'
```

Thie FocusBlurTextField component is a TextField component that includes event handler functions. These functions include onBlur, onFocus, onKeyUp, and onCommitValue.

### Variations
Text Field with Prompt
```
<FocusBlurTextField
    name="patientOrResearchId"
    value={''}
    onCommitValue={({ onChangeFilter }) => ({
      target: { name, value },
    }) =>
      onChangeFilter({
        [name]: value,
      })}
    floatingLabelFixed
    hintText={'Enter patient/study ID...'}
    floatingLabelText={'Patient/Study ID'}
/>
```
