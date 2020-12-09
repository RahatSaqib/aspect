# How to include attachments in notification email

Requested in ASP-1801, ASP-1840

## Placeholder pattern

Variables are marked with simbol `@`
```
<attachment:@reportName(@param1, @param2, ...)>
```

Example: `<attachment:error-history(deviceId, 'last-30-days')>`


## Files to check

- api/src/email/service.js - see func generateAttachments() where new @reportName value should be implemented to get data for attachment
- tests in api/test/email/emailMq.spec.js

