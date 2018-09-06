### Usage

```js static
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from 'src/components/shared/expansionPanel'
```

The ExpansionPanel component contain creation flows and allow lightweight editing of an element.

### Variations

Standard ExpansionPanel Container

```
<ExpansionPanel expanded={false}>
  <ExpansionPanelHeader label="Location" collapsedChildren={'Site'}>
    Site Name
  </ExpansionPanelHeader>
  <ExpansionPanelDetail>
    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
  </ExpansionPanelDetail>
</ExpansionPanel>
```
