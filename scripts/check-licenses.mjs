import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Inventory the locked production tree, including nested package installations.
// Upstream files are the primary evidence; SPDX metadata alone is insufficient.
const write = process.argv.includes('--write');
const root = path.resolve(process.argv.slice(2).find(arg => arg !== '--write') ?? '.');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const reviewed = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause']);
const packages = [];
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location || entry.dev) continue;
  assert.ok(location.startsWith('node_modules/') && !location.split('/').includes('..'), 'Invalid package location');
  const dir = path.join(root, location);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.version, entry.version, `Installed version differs: ${location}`);
  assert.ok(reviewed.has(pkg.license), `Review new license for ${pkg.name}: ${pkg.license}`);
  const files = fs.readdirSync(dir).filter(name => /^(licen[sc]e|copying|notice|copyright)([.-]|$)/i.test(name)).sort();
  assert.ok(files.some(name => /^(licen[sc]e|copying)([.-]|$)/i.test(name)), `Missing license: ${location}`);
  const notices = files.map(name => {
    const file = path.join(dir, name);
    assert.ok(fs.lstatSync(file).isFile(), `License must be a regular file: ${location}/${name}`);
    const contents = fs.readFileSync(file);
    assert.ok(contents.toString('utf8').trim(), `Empty license: ${location}/${name}`);
    return { file: name, sha256: crypto.createHash('sha256').update(contents).digest('hex') };
  });
  packages.push({ location, name: pkg.name, version: pkg.version, license: pkg.license, notices });
}
const inventory = JSON.stringify({ format: 1, packages }, null, 2) + '\n';
const destination = path.join(root, 'third-party-licenses.json');
if (write) fs.writeFileSync(destination, inventory);
else assert.deepEqual(JSON.parse(fs.readFileSync(destination, 'utf8')), JSON.parse(inventory), 'License inventory differs. Review upstream files before regenerating with --write.');
console.log(`${packages.length} locked production installations: upstream license files and hashes ${write ? 'recorded' : 'verified'}.`);
