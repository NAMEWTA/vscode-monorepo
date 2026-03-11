#!/usr/bin/env node

/**
 * Create a new VS Code extension in the monorepo.
 *
 * Usage:
 *   npm run new-extension -- --name my-awesome-plugin
 *   npm run new-extension -- --name my-awesome-plugin --display "My Awesome Plugin"
 */

import { existsSync, mkdirSync, writeFileSync, cpSync } from 'fs';
import { join, resolve } from 'path';

const args = process.argv.slice(2);
const nameIndex = args.indexOf('--name');
const displayIndex = args.indexOf('--display');

if (nameIndex === -1 || !args[nameIndex + 1]) {
  console.error('Usage: npm run new-extension -- --name <extension-name> [--display "Display Name"]');
  process.exit(1);
}

const name = args[nameIndex + 1];
const displayName = displayIndex !== -1 && args[displayIndex + 1]
  ? args[displayIndex + 1]
  : name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const root = resolve(import.meta.dirname, '..');
const templateDir = join(root, 'apps', 'template-plugin');
const targetDir = join(root, 'apps', name);

if (existsSync(targetDir)) {
  console.error(`Error: Directory apps/${name} already exists.`);
  process.exit(1);
}

console.log(`Creating new extension: ${name} (${displayName})`);
console.log(`  Template: apps/template-plugin`);
console.log(`  Target:   apps/${name}`);

// Copy template
cpSync(templateDir, targetDir, { recursive: true });

// Update package.json
const pkgPath = join(targetDir, 'package.json');
const pkg = JSON.parse(await import('fs').then(fs => fs.readFileSync(pkgPath, 'utf-8')));

const commandPrefix = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

pkg.name = name;
pkg.displayName = displayName;
pkg.description = `VS Code extension: ${displayName}`;
pkg.version = '0.0.1';
pkg.contributes.commands = [
  {
    command: `${commandPrefix}.showPanel`,
    title: 'Show Panel',
    category: displayName,
  },
];

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`\n✅ Extension "${name}" created successfully!`);
console.log(`\nNext steps:`);
console.log(`  1. cd apps/${name}`);
console.log(`  2. Update package.json with your extension details`);
console.log(`  3. Update src/extension.ts with your command prefix`);
console.log(`  4. If you add file persistence, store it under ~/.vscode-namewta/${name}/`);
console.log(`  5. Run: npm install (from monorepo root)`);
console.log(`  6. Run: npm run dev (from monorepo root)`);
