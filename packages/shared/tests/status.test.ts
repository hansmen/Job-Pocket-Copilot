import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLICATION_STATUSES,
  InvalidTransitionError,
  assertTransition,
  canTransition,
  isApplicationStatus,
  isTerminal,
  needsFollowUp,
  nextStatuses,
} from '../src/status.ts';

test('saved can only move to applied or withdrawn', () => {
  assert.deepEqual([...nextStatuses('saved')], ['applied', 'withdrawn']);
  assert.equal(canTransition('saved', 'offer'), false);
});

test('applied leads to all stages of the process', () => {
  for (const to of ['hr_screen', 'tech_interview', 'test_task', 'offer', 'rejected', 'ghosted']) {
    assert.equal(canTransition('applied', to as never), true, to);
  }
});

test('rejected and withdrawn are terminal: nowhere to go next', () => {
  assert.deepEqual([...nextStatuses('rejected')], []);
  assert.deepEqual([...nextStatuses('withdrawn')], []);
});

test('ghosted can be reopened', () => {
  assert.equal(canTransition('ghosted', 'hr_screen'), true);
  assert.equal(canTransition('ghosted', 'applied'), false);
});

test('a status does not transition to itself', () => {
  for (const s of APPLICATION_STATUSES) {
    assert.equal(canTransition(s, s), false, s);
  }
});

test('assertTransition throws InvalidTransitionError', () => {
  assert.throws(() => assertTransition('saved', 'offer'), InvalidTransitionError);
  assert.doesNotThrow(() => assertTransition('saved', 'applied'));
});

test('nothing can transition to saved', () => {
  for (const s of APPLICATION_STATUSES) {
    assert.equal(canTransition(s, 'saved'), false, s);
  }
});

test('isTerminal and needsFollowUp', () => {
  assert.equal(isTerminal('offer'), true);
  assert.equal(isTerminal('applied'), false);
  assert.equal(needsFollowUp('saved'), false);
  assert.equal(needsFollowUp('applied'), true);
  assert.equal(needsFollowUp('rejected'), false);
});

test('isApplicationStatus filters out foreign values', () => {
  assert.equal(isApplicationStatus('applied'), true);
  assert.equal(isApplicationStatus('APPLIED'), false);
  assert.equal(isApplicationStatus(42), false);
});
