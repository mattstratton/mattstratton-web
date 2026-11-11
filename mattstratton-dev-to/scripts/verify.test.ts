import { describe, it, expect } from 'vitest'
import { findDestructive } from './verify.js'

const live = {
  title: 'Verifying identity',
  description: 'A description',
  canonical_url: 'https://dev.to/mattstratton/verifying-identity-2b0b',
  tags: ['infosec', 'privacy', 'security'],
  tag_list: 'infosec, privacy, security',
}
const git = {
  title: 'Verifying identity',
  description: 'A description',
  canonical_url: 'https://dev.to/mattstratton/verifying-identity-2b0b',
  tags: ['infosec', 'privacy', 'security'],
}

describe('findDestructive', () => {
  it('passes when git matches live', () => {
    expect(findDestructive(git, live)).toEqual([])
  })

  it('flags git tags: [] when live has tags (the verifying-identity landmine)', () => {
    const out = findDestructive({ ...git, tags: [] }, live)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(/^tags:/)
  })

  it('flags git having fewer tags than live', () => {
    expect(findDestructive({ ...git, tags: ['infosec'] }, live)).toHaveLength(1)
  })

  it('reads live tags from the tag_list string when tags is absent', () => {
    const { tags: _tags, ...noArray } = live
    expect(findDestructive({ ...git, tags: [] }, noArray)).toHaveLength(1)
  })

  it('does not flag git adding tags or changing them one-for-one', () => {
    expect(findDestructive({ ...git, tags: ['a', 'b', 'c', 'd'] }, live)).toEqual([])
    expect(findDestructive({ ...git, tags: ['x', 'y', 'z'] }, live)).toEqual([])
  })

  it('does not flag tags: [] when live also has none (phantom-update post)', () => {
    expect(findDestructive({ ...git, tags: [] }, { ...live, tags: [], tag_list: '' })).toEqual([])
  })

  it.each(['title', 'description', 'canonical_url'])('flags empty %s when live has one', (field) => {
    const out = findDestructive({ ...git, [field]: '' }, live)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(new RegExp(`^${field}:`))
  })

  it('does not flag a legitimate retitle', () => {
    expect(findDestructive({ ...git, title: 'A better title' }, live)).toEqual([])
  })
})
