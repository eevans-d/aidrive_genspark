import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

const ROOT = resolve(__dirname, '..', '..');

function readJSON(relPath: string) {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf8'));
}

function extractSemver(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let v = raw.replace(/^[~^]/, '');
  const urlMatch = v.match(/@(\d+\.\d+\.\d+)/);
  if (urlMatch) return urlMatch[1];
  const semverMatch = v.match(/^(\d+\.\d+\.\d+)/);
  if (semverMatch) return semverMatch[1];
  return null;
}

describe('dependency-alignment: @supabase/supabase-js', () => {
  const PKG = '@supabase/supabase-js';

  const rootPkg = readJSON('package.json');
  const frontendPkg = readJSON('minimarket-system/package.json');
  const denoJson = readJSON('supabase/functions/deno.json');
  const importMap = readJSON('supabase/functions/import_map.json');

  const rootVersion = extractSemver(
    rootPkg.devDependencies?.[PKG] || rootPkg.dependencies?.[PKG]
  );
  const frontendVersion = extractSemver(
    frontendPkg.dependencies?.[PKG] || frontendPkg.devDependencies?.[PKG]
  );
  const denoVersion = extractSemver(denoJson.imports?.[PKG]);
  const importMapVersion = extractSemver(importMap.imports?.[PKG]);

  it('root package.json has @supabase/supabase-js', () => {
    expect(rootVersion).not.toBeNull();
  });

  it('frontend package.json has @supabase/supabase-js', () => {
    expect(frontendVersion).not.toBeNull();
  });

  it('deno.json has @supabase/supabase-js', () => {
    expect(denoVersion).not.toBeNull();
  });

  it('import_map.json has @supabase/supabase-js', () => {
    expect(importMapVersion).not.toBeNull();
  });

  it('root version matches frontend version', () => {
    expect(rootVersion).toBe(frontendVersion);
  });

  it('root version matches deno.json version', () => {
    expect(rootVersion).toBe(denoVersion);
  });

  it('root version matches import_map.json version', () => {
    expect(rootVersion).toBe(importMapVersion);
  });

  it('all four sources resolve to the same semver', () => {
    const versions = [rootVersion, frontendVersion, denoVersion, importMapVersion];
    const unique = new Set(versions.filter(Boolean));
    expect(unique.size).toBe(1);
  });

  it('root package.json uses pinned version (no caret/tilde)', () => {
    const raw = rootPkg.devDependencies?.[PKG] || rootPkg.dependencies?.[PKG];
    expect(raw).not.toMatch(/^[~^]/);
  });

  it('frontend package.json uses pinned version (no caret/tilde)', () => {
    const raw = frontendPkg.dependencies?.[PKG] || frontendPkg.devDependencies?.[PKG];
    expect(raw).not.toMatch(/^[~^]/);
  });

  it('critical dependency checker script exits successfully', () => {
    const scriptPath = resolve(ROOT, 'scripts/check-critical-deps-alignment.mjs');
    const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
    expect(result.status).toBe(0);
  });
});
