import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const assets = [
  "xian-city-wall-hero.webp",
  "giant-wild-goose-pagoda.webp",
  "xian-muslim-quarter.webp",
  "xian-yangrou-paomo.webp",
  "xian-roujiamo.webp",
  "tang-sancai-woman.webp",
  "dacien-temple.webp",
];

test("editorial image assets are optimized local WebP files", async () => {
  for (const asset of assets) {
    const path = `public/images/tang-atlas/${asset}`;
    const bytes = await readFile(path);
    const metadata = await stat(path);

    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(metadata.size >= 20_000, `${asset} is unexpectedly small`);
    assert.ok(metadata.size <= 900_000, `${asset} is too large for the site`);
  }
});
