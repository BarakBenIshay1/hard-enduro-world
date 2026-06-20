# Live Status

The first implementation does not include live timing, but the data model is prepared for it.

`Event.liveStatus` and `RaceStage.status` support:

- Upcoming
- Live
- Suspended
- Finished
- Cancelled
- Unknown

Future live timing can update stage rows incrementally without changing the core event model.
