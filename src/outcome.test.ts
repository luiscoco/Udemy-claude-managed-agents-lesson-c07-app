import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "./outcome";
test("idle needs a reason and interruption context", () => {
  assert.equal(classify("idle","end_turn",false),"completed");
  assert.equal(classify("idle","end_turn",true),"interrupted");
  assert.equal(classify("idle","budget_reached",false),"paused-budget");
  assert.equal(classify("idle","requires_action",false),"requires-action");
  assert.equal(classify("idle","unknown",false),"error");
  assert.equal(classify("rescheduling",undefined,true),"incomplete");
  assert.equal(classify("terminated",undefined,false),"terminated");
});
