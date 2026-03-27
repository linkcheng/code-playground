import { test } from "node:test";
import assert from "node:assert";
import { sayHi } from "./index";


test("sayHi", async (t) => {
    const log = t.mock.method(global.console, "log");
    assert.strictEqual(log.mock.callCount(), 0);
    const result = await sayHi("World");
    assert.strictEqual(log.mock.callCount(), 1);
    assert.strictEqual(result, "hello World!");
});
