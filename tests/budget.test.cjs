const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const file = path.resolve(__dirname, "../src/lib/budget.ts");
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const source = new Module(file, module);
source._compile(compiled, file);
const { budgetTotals, parseMoney } = source.exports;
test("full invoice cost and deposit are counted separately from vendor payments", () => {
  assert.deepEqual(
    budgetTotals(
      1000,
      [{ total: 400, balance: 250, status: "confirmed" }],
      [{ amount: 300, paid_amount: 100 }],
    ),
    { total: 700, paid: 250, due: 450, remaining: 300 },
  );
});
test("cancelled bookings are excluded, with unpaid pending deposits still committed", () => {
  assert.deepEqual(
    budgetTotals(
      1000,
      [
        { total: 800, balance: 0, status: "cancelled" },
        { total: 250, balance: 250, status: "pending_deposit" },
      ],
      [],
    ),
    { total: 250, paid: 0, due: 250, remaining: 750 },
  );
});
test("over budget remains visible instead of clamping to zero", () => {
  assert.equal(
    budgetTotals(100, [], [{ amount: 130, paid_amount: 130 }]).remaining,
    -30,
  );
});
test("money totals use cents across multiple fractional amounts", () => {
  assert.deepEqual(
    budgetTotals(
      0.3,
      [],
      [
        { amount: 0.1, paid_amount: 0 },
        { amount: 0.2, paid_amount: 0 },
      ],
    ),
    { total: 0.3, paid: 0, due: 0.3, remaining: 0 },
  );
});
test("valid money includes zero and maximum database precision", () => {
  for (const value of ["0", "10.50", "99999999.99"])
    assert.equal(parseMoney(value), Number(value));
});
test("money rejects negative, ambiguous, missing and excessive precision values", () => {
  for (const value of [
    null,
    "",
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "2.001",
    "1,000",
    "100000000",
  ])
    assert.throws(() => parseMoney(value));
});
