# How to include attachments in notification email

Requested in ASP-1801, ASP-1840

## Placeholder pattern

Set field `attachments` in EmailTemplate as this
```
[
  {
    type: 'report type which to process in api/src/email/service.js in func generateAttachments()',
    <any other props to destructure in func generateAttachments() based on 'type' value>
  }
]
```

Example value of `attachments` field in EmailTemplate: 
```
attachments: JSON.stringify([
  {
    type: 'error-history',
    period: 'last-30-days',
  },
])
```


## Files to check

- api/src/email/service.js - see func generateAttachments()
- tests in api/test/email/emailMq.spec.js

