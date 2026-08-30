import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addItemSchema, imageUrlSchema, MAX_MONEY } from '@/lib/validators/item';

describe('imageUrlSchema', () => {
  it('accepts JPEG / PNG / WebP data URIs', () => {
    assert.equal(imageUrlSchema.safeParse('data:image/jpeg;base64,/9j/4AAQSkZJRg==').success, true);
    assert.equal(imageUrlSchema.safeParse('data:image/png;base64,iVBORw0KGgo=').success, true);
    assert.equal(imageUrlSchema.safeParse('data:image/webp;base64,UklGRhoAAABX').success, true);
  });

  it('rejects SVG (can carry script)', () => {
    assert.equal(imageUrlSchema.safeParse('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=').success, false);
    assert.equal(imageUrlSchema.safeParse('data:image/svg+xml,<svg onload=alert(1)></svg>').success, false);
  });

  it('rejects external URLs', () => {
    assert.equal(imageUrlSchema.safeParse('https://evil.example/tracker.gif').success, false);
  });

  it('rejects payloads over the size cap', () => {
    assert.equal(imageUrlSchema.safeParse('data:image/jpeg;base64,' + 'A'.repeat(1_100_000)).success, false);
  });
});

describe('addItemSchema money bounds', () => {
  it('accepts a normal value', () => {
    assert.equal(addItemSchema.safeParse({ name: 'Laptop', category: 'TECH', value: 3_500_000 }).success, true);
  });

  it('rejects a value over MAX_MONEY', () => {
    assert.equal(addItemSchema.safeParse({ name: 'Laptop', category: 'TECH', value: MAX_MONEY * 1000 }).success, false);
  });

  it('rejects a negative value', () => {
    assert.equal(addItemSchema.safeParse({ name: 'Laptop', category: 'TECH', value: -1 }).success, false);
  });

  it('requires a name and a valid category', () => {
    assert.equal(addItemSchema.safeParse({ name: '', category: 'TECH' }).success, false);
    assert.equal(addItemSchema.safeParse({ name: 'x', category: 'NOT_A_CATEGORY' }).success, false);
  });
});
