import { JSDOM } from 'jsdom'
import { findLink } from 'src/utils/statusParser'

describe('findLink', () => {
  describe('Pleroma', () => {
    const doc = new JSDOM(`<html><head></head><body>
<div class="status-body">
<p>
I released Whalebird version 2.4.1. In version 2.4.0, Whalebird supports streaming update of Pleroma. But it contains a bug, so it is resolved in version 2.4.1.  <br /><a href="https://github.com/h3poteto/whalebird-desktop/releases/tag/2.4.1" id="link">https://github.com/h3poteto/whalebird-desktop/releases/tag/2.4.1</a><br /><a href="https://pleroma.io/tag/whalebird">#Whalebird</a>
</p>
</div>
</body>
</html>`).window.document

    const target = doc.getElementById('link')
    it('should find', () => {
      const res = findLink(target, 'status-body')
      expect(res).toEqual('https://github.com/h3poteto/whalebird-desktop/releases/tag/2.4.1')
    })
  })
})
