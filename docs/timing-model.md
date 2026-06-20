# Timing Model

The platform stores both stage results and final event classifications.

- `RaceStage` represents prologues, race days, finals, qualifying sessions, and other official stages.
- `StageResult` stores complete timing rows for each stage.
- `Result` stores the final overall event classification.

Timing values should keep both machine-readable fields such as `totalTimeMs` and display-preserving fields such as `totalTimeText`.

`officialRawRow` should preserve the parsed official row for traceability.
