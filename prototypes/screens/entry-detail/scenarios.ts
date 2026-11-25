// Entry detail: one entry, to check, edit or delete (J3 step 6). It is the Entries screen with the
// entry open: beside the list on computers, its own page on phones, at /entries/<id>. Settled
// decisions and open questions are in screens/entries/scenarios.ts.
//
// Decided with the user (2026-11-21):
// - It shows the amount, kind, name, category (or its split), account (or from → to), date, note,
//   tags, when it was logged and changed, and for an app-added one, where it came from.
// - "What it changed": the account's balance before and after, and where it counts, such as
//   November's spending under Groceries. Moved money says net worth stayed the same.
// - "Same place": how often, how much in all, and what it usually costs, linked to the list
//   filtered to that name.
// - Edit opens Quick add's form, titled "Edit entry". Log again opens it titled "Add", dated
//   today. Delete happens at once and goes back to the list, with Undo for 10 s.
// - A correction comes from a debt's balance check, so it has no Edit or Log again here.

import {
  SAMPLE_APP_ADDED_ID,
  SAMPLE_CORRECTION_ID,
  SAMPLE_MOVED_ID,
  SAMPLE_RECEIVED_ID,
  SAMPLE_SPENT_ID,
  SAMPLE_SPLIT_ID,
} from "@proto/fixtures/entry-history";
import type { Scenarios } from "@proto/kit/scenarios";
import {
  type EntriesViewProps,
  typicalData,
} from "@proto/screens/entries/scenarios";

const data = typicalData();

const ERROR_MESSAGE =
  "Nothing is lost. Check your connection and try again in a moment.";

export const scenarios = {
  // The entry the path names: /entries/e-1042, a spent entry with a note, typed days later.
  default: { status: "ready", data },
  received: { status: "ready", data, start: { open: SAMPLE_RECEIVED_ID } },
  moved: { status: "ready", data, start: { open: SAMPLE_MOVED_ID } },
  split: { status: "ready", data, start: { open: SAMPLE_SPLIT_ID } },
  "app-added": {
    status: "ready",
    data,
    start: { open: SAMPLE_APP_ADDED_ID },
  },
  correction: {
    status: "ready",
    data,
    start: { open: SAMPLE_CORRECTION_ID },
  },
  // The edit form open, while Save waits.
  saving: {
    status: "ready",
    data,
    start: { open: SAMPLE_SPENT_ID, edit: "saving" },
  },
  // The edit form open after a failed save: what was typed is still there.
  "save-failed": {
    status: "ready",
    data,
    start: { open: SAMPLE_SPENT_ID, edit: "failed" },
  },
  // Delete was just pressed: back on the list, with Undo.
  deleted: {
    status: "ready",
    data,
    start: { open: SAMPLE_SPENT_ID, deleted: true },
  },
  "not-found": { status: "ready", data, start: { open: "e-0000" } },
  loading: { status: "loading" },
  error: { status: "error", message: ERROR_MESSAGE },
} satisfies Scenarios<EntriesViewProps>;
