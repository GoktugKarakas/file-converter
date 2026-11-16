# ADR-002: Batch Output Collision Policy

**Status:** Accepted  
**Date:** 2026-11-16

## Context

Multiple conversion requests within a batch may produce the same output destination.

Executing these requests could create conflicting filesystem operations or make the outcome dependent on execution order.

The manager must resolve these conflicts without preventing unrelated conversions from completing.

## Decision

The conversion manager will use a **reject-all-conflicting policy**.

When multiple requests target the same output destination, all requests involved in that conflict will be rejected.

Requests without conflicts will continue processing.

## Rationale

Rejecting all conflicting requests provides deterministic behavior independent of request order.

It prevents the manager from arbitrarily selecting one conversion over another.

The policy also preserves best-effort execution by allowing unrelated requests to proceed.

## Consequences

- The manager must detect batch-level output conflicts before executing affected requests.
- Conflicting requests must produce individual failure results.
- Unrelated requests must remain eligible for execution.
- The implementation must define how output paths are compared across supported operating systems.
- Individual engines and output publishing utilities must continue enforcing their own validation and collision protections.

## Alternatives Considered

### First-Wins

Execute the first request targeting a destination and reject subsequent requests with the same destination.

**Not selected:** The outcome would depend on request ordering rather than treating conflicting requests equally.

### Reject Entire Batch

Reject the complete batch if any output conflict is detected.

**Not selected:** This would unnecessarily prevent independent, valid conversions from completing.
