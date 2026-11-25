const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('package metadata and lockfile consistently identify ITACHI UCHIHA BOT', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const lockfile = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    assert.equal(packageJson.name, 'itachi-uchiha-bot');
    assert.equal(lockfile.name, packageJson.name);
    assert.equal(lockfile.packages[''].name, packageJson.name);
    assert.match(packageJson.description, /ITACHI UCHIHA BOT/);
    assert.equal(packageJson.author, 'ITACHI UCHIHA');
});

test('tracked project source no longer contains Syed Mini Bot branding', () => {
    const { execFileSync } = require('node:child_process');
    const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
    const legacyBranding = /syed[ -]+mini[ -]+bot|syed[ -]+md/i;
    const matches = trackedFiles.filter((relativePath) => {
        try {
            return legacyBranding.test(fs.readFileSync(path.join(root, relativePath), 'utf8'));
        } catch {
            return false;
        }
    });
    assert.deepEqual(matches, []);
});
