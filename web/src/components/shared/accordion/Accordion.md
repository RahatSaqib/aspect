### Usage

```js static
import {
  Accordion,
  AccordionHeader,
  AccordionDetail,
} from 'src/components/shared/accordion'
```

The Accordion component contain creation flows and allow lightweight editing of an element.

### Variations

Standard Accordion Container

```
<Accordion expanded={false}>
  <AccordionHeader label="Location" collapsedChildren={'Site'}>
    Site Name
  </AccordionHeader>
  <AccordionDetail>
    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
  </AccordionDetail>
</Accordion>
```
