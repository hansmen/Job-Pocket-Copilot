import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSameJobUrl, normalizeJobUrl } from '../src/url.ts';

test('strips utm parameters, hash, www and trailing slash', () => {
  assert.equal(
    normalizeJobUrl('https://www.Example.com/jobs/123/?utm_source=x&utm_medium=y#apply'),
    'https://example.com/jobs/123',
  );
});

test('keeps meaningful parameters and sorts them', () => {
  assert.equal(
    normalizeJobUrl('https://example.com/job?b=2&a=1&gclid=zzz'),
    'https://example.com/job?a=1&b=2',
  );
});

test('adds https when there is no protocol', () => {
  assert.equal(normalizeJobUrl('djinni.co/jobs/777-react-native/'), 'https://djinni.co/jobs/777-react-native');
});

test('LinkedIn is reduced to the canonical form by id', () => {
  assert.equal(
    normalizeJobUrl('https://www.linkedin.com/jobs/view/senior-react-native-dev-at-acme-3912345678/?trackingId=abc&refId=def'),
    'https://linkedin.com/jobs/view/3912345678',
  );
  assert.equal(
    normalizeJobUrl('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=3912345678'),
    'https://linkedin.com/jobs/view/3912345678',
  );
});

test('returns null for garbage and unsafe schemes', () => {
  assert.equal(normalizeJobUrl(''), null);
  assert.equal(normalizeJobUrl('   '), null);
  assert.equal(normalizeJobUrl('javascript:alert(1)'), null);
  assert.equal(normalizeJobUrl('ftp://example.com/file'), null);
  assert.equal(normalizeJobUrl('just some text'), null);
  assert.equal(normalizeJobUrl('http://localhost:3000/x'), null);
});

test('isSameJobUrl compares after normalization', () => {
  assert.equal(
    isSameJobUrl('https://example.com/jobs/1?utm_source=a', 'http://www.example.com/jobs/1/'),
    true,
  );
  assert.equal(isSameJobUrl('https://example.com/jobs/1', 'https://example.com/jobs/2'), false);
  assert.equal(isSameJobUrl('abc', 'abc'), false);
});
