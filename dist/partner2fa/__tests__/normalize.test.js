import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEnrollmentTerminal } from "../normalize.js";
test("normalizeEnrollmentTerminal: completed wins", () => {
    assert.equal(normalizeEnrollmentTerminal({ status: "completed", identityStatus: "active" }), "COMPLETED");
});
test("normalizeEnrollmentTerminal: expired", () => {
    assert.equal(normalizeEnrollmentTerminal({ status: "expired", identityStatus: "active" }), "EXPIRED");
});
test("normalizeEnrollmentTerminal: cancelled", () => {
    assert.equal(normalizeEnrollmentTerminal({ status: "cancelled", identityStatus: "active" }), "CANCELLED");
});
test("normalizeEnrollmentTerminal: failed from identity status", () => {
    assert.equal(normalizeEnrollmentTerminal({ status: "phone_sent", identityStatus: "revoked" }), "FAILED");
    assert.equal(normalizeEnrollmentTerminal({ status: "pending", identityStatus: "suspended" }), "FAILED");
});
test("normalizeEnrollmentTerminal: non-terminal", () => {
    assert.equal(normalizeEnrollmentTerminal({ status: "pending", identityStatus: "active" }), null);
});
