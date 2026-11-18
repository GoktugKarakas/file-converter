# ADR-001: Best-Effort Batch Conversion

**Status:** Accepted  
**Date:** 2026-11-16

## Context

The application supports converting multiple files through a conversion manager.

Individual conversions may fail. I need to define how a failure should affect the remaining conversions in a batch.

## Decision

The conversion manager will follow a **best-effort execution policy**.

If an individual conversion fails, the manager should record its outcome and continue processing other independent conversion requests.

The manager should produce a batch-level result containing the outcomes of individual conversions.

## Rationale

A failure in one conversion should not prevent other valid files from being converted.

This approach allows users to receive successful outputs even when some files cannot be processed.

## Consequences

- The manager must track success and failure for individual conversions.
- A batch may finish with partial success.
- The UI must be able to distinguish successful and failed conversions.
- Logging must not be the only mechanism for communicating failures.
- Explicit cancellation or batch-wide fatal errors may terminate execution.

## Alternatives Considered

### Fail-fast execution

Stop the batch after the first conversion failure.

**Not selected:** This would unnecessarily prevent independent conversions from completing.
