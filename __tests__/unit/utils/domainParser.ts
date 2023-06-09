import { parseDomain } from 'src/utils/domainParser'

describe('domainParser', () => {
  describe('parseDomain', () => {
    it('URL is provided', () => {
      const res = parseDomain('https://mastodon.social')
      expect(res).toEqual('mastodon.social')
    })
    it('URL with path is provided', () => {
      const res = parseDomain('https://mastodon.social/hoge/fuga?param=param')
      expect(res).toEqual('mastodon.social')
    })
    it('domain is provided', () => {
      const res = parseDomain('mastodon.social')
      expect(res).toEqual('mastodon.social')
    })
  })
})
