import fs from 'node:fs';
import path from 'node:path';

const changelogPath = path.resolve('src/data/changelog.ts');

const prNumber = process.env.PR_NUMBER || '';
const prTitle = (process.env.PR_TITLE || '').trim();
const issueNumber = process.env.ISSUE_NUMBER || '';
const issueTitle = (process.env.ISSUE_TITLE || '').trim();

let labels = [];
try {
  labels = JSON.parse(process.env.LABELS_JSON || '[]');
} catch {
  labels = [];
}

if (!fs.existsSync(changelogPath)) {
  console.error('Missing src/data/changelog.ts');
  process.exit(1);
}

const content = fs.readFileSync(changelogPath, 'utf8');

const refNumber = issueNumber || prNumber;
if (refNumber && content.includes(`#${refNumber}`)) {
  console.log('Entry already exists, skipping');
  process.exit(0);
}

const lowerLabels = labels.map((l) => String(l).toLowerCase());
let type = 'feature';
if (lowerLabels.some((l) => l.includes('ui'))) type = 'ui';
if (lowerLabels.some((l) => l.includes('balance'))) type = 'balance';
if (lowerLabels.some((l) => l.includes('fix') || l.includes('bug'))) type = 'fix';

const baseTitle = issueTitle || prTitle || 'Mise à jour';
const desc = refNumber
  ? `${baseTitle} (#${refNumber})`
  : baseTitle;

const escapedDesc = desc.replace(/'/g, "\\'");
const changeLine = `      { type: '${type}', description: '${escapedDesc}' },\n`;

function insertIntoUnreleased(src) {
  const unreleasedIndex = src.indexOf("version: 'Unreleased'");
  if (unreleasedIndex === -1) return null;

  // Met à jour la date du bloc Unreleased à la date du jour
  const today = new Date().toISOString().slice(0, 10);
  const datePattern = /date: '[^']*'(?=[\s\S]*?title: 'Mises à jour récentes')/;
  let updated = src;
  const blockEnd = src.indexOf('  },', unreleasedIndex);
  const block = src.slice(unreleasedIndex, blockEnd);
  const updatedBlock = block.replace(/date: '[^']*'/, `date: '${today}'`);
  updated = src.slice(0, unreleasedIndex) + updatedBlock + src.slice(blockEnd);

  const changesIndex = updated.indexOf('changes: [', unreleasedIndex);
  if (changesIndex === -1) return null;

  const insertPos = changesIndex + 'changes: [\n'.length;
  return updated.slice(0, insertPos) + changeLine + updated.slice(insertPos);
}

function insertNewUnreleased(src) {
  const arrayStart = src.indexOf('export const CHANGELOG: ChangelogEntry[] = [');
  if (arrayStart === -1) return null;

  const openBracket = src.indexOf('[', arrayStart);
  if (openBracket === -1) return null;

  const unreleasedEntry = `\n  {\n    version: 'Unreleased',\n    date: '${new Date().toISOString().slice(0, 10)}',\n    title: 'Mises à jour récentes',\n    changes: [\n${changeLine}    ],\n  },`;

  return src.slice(0, openBracket + 1) + unreleasedEntry + src.slice(openBracket + 1);
}

let next = insertIntoUnreleased(content);
if (!next) {
  next = insertNewUnreleased(content);
}

if (!next) {
  console.error('Could not update changelog format safely');
  process.exit(1);
}

fs.writeFileSync(changelogPath, next, 'utf8');
console.log('Changelog updated');
