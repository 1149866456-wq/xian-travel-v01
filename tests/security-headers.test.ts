import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config";

test("global security headers and stricter success headers are configured", async () => {
  assert.equal(typeof nextConfig.headers, "function");
  const rules = await nextConfig.headers!();
  const global = rules.find((rule) => rule.source === "/(.*)");
  const success = rules.find((rule) => rule.source === "/booking/success");
  assert.ok(global);
  assert.ok(success);

  const globalHeaders = Object.fromEntries(global.headers.map(({ key, value }) => [key, value]));
  assert.match(globalHeaders["Content-Security-Policy"], /default-src 'self'/);
  assert.match(globalHeaders["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(globalHeaders["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(globalHeaders["X-Content-Type-Options"], "nosniff");
  assert.equal(globalHeaders["X-Frame-Options"], "DENY");
  assert.match(globalHeaders["Permissions-Policy"], /camera=\(\)/);

  const successHeaders = Object.fromEntries(success.headers.map(({ key, value }) => [key, value]));
  assert.equal(successHeaders["Cache-Control"], "private, no-store, max-age=0");
  assert.equal(successHeaders["Referrer-Policy"], "no-referrer");
  assert.equal(successHeaders["X-Robots-Tag"], "noindex, nofollow");

  const effective = Object.fromEntries(rules
    .filter((rule) => rule.source === "/(.*)" || rule.source === "/booking/success")
    .flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])));
  assert.equal(effective["Referrer-Policy"], "no-referrer");
});
