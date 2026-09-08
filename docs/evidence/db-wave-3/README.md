# DB-W3 evidence

This directory stores non-secret operational and acceptance evidence for database-governance Wave 3.

Expected files:

```text
W3-A-contract-inventory.md
W3-B-api-schema-design-acceptance.md
W3-C-migration-apply.md
W3-D-low-privilege-acceptance.md
W3-E-jackpot-site-cutover.md
W3-F-public-contract-disposition.md
WAVE_3_CLOSEOUT.md
```

Not every packet requires a separate file if one document cleanly contains the evidence, but final closeout must be able to point to durable evidence for every acceptance condition.

## Evidence rules

Record:

- date;
- environment;
- repo/PR/SHA;
- command/query purpose;
- non-secret result;
- conclusion.

Never record:

- service-role keys;
- publishable/anon key values;
- passwords/tokens;
- full confidential payloads when counts/statuses are sufficient.

Distinguish:

```text
PLANNED
IMPLEMENTED
APPLIED
VERIFIED
ACCEPTED
```

Do not infer operational acceptance solely from merged code.
