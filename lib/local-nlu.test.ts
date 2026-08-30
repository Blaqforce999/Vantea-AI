import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseItemLocally } from '@/lib/local-nlu';

const FIXED_NOW = new Date('2025-06-15T12:00:00.000Z');

describe('parseItemLocally', () => {
  it('extracts name, amount, currency and category from a clear sentence', () => {
    const r = parseItemLocally('I bought a MacBook Pro for 3.5 million naira', FIXED_NOW);
    assert.equal(r.type, 'item');
    if (r.type !== 'item') return;
    assert.equal(r.item.name, 'MacBook Pro'); // original casing is preserved past the first letter
    assert.equal(r.item.value, 3_500_000);
    assert.equal(r.item.currency, 'NGN');
    assert.equal(r.item.category, 'TECH');
  });

  it('handles spelled-out numbers', () => {
    const r = parseItemLocally('got a road bike for five hundred thousand', FIXED_NOW);
    assert.equal(r.type, 'item');
    if (r.type !== 'item') return;
    assert.equal(r.item.value, 500_000);
  });

  it('defaults a bare amount to NGN', () => {
    const r = parseItemLocally('bought a camera for 250000', FIXED_NOW);
    if (r.type !== 'item') throw new Error('expected item');
    assert.equal(r.item.currency, 'NGN');
  });

  it('leaves currency undefined when no value is stated', () => {
    const r = parseItemLocally('I acquired a plot of land', FIXED_NOW);
    if (r.type !== 'item') throw new Error('expected item');
    assert.equal(r.item.value, undefined);
    assert.equal(r.item.currency, undefined);
    assert.equal(r.item.category, 'HOME_AND_LAND');
  });

  it('pulls a why-note out of a "because" clause', () => {
    const r = parseItemLocally('bought a watch for 400k because it was my first big purchase', FIXED_NOW);
    if (r.type !== 'item') throw new Error('expected item');
    assert.equal(r.item.whyNote, 'it was my first big purchase');
  });

  it('replies conversationally to a greeting with no item', () => {
    assert.equal(parseItemLocally('hey there', FIXED_NOW).type, 'reply');
  });

  it('replies conversationally to plain chit-chat', () => {
    assert.equal(parseItemLocally('what a nice day today', FIXED_NOW).type, 'reply');
  });

  it('resolves a relative date', () => {
    const r = parseItemLocally('bought a laptop for 500k last week', FIXED_NOW);
    if (r.type !== 'item') throw new Error('expected item');
    assert.equal(r.item.acquiredDate, '2025-06-08');
  });
});
