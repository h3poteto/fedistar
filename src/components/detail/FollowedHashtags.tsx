import { Header, FlexboxGrid, Button, Content, List } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsX, BsChevronLeft } from 'react-icons/bs'
import { useIntl, FormattedMessage } from 'react-intl'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { invoke } from '@tauri-apps/api/tauri'

import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'

export default function FollowedHashtags() {
  const { formatMessage } = useIntl()
  const router = useRouter()

  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [hashtags, setHashtags] = useState<Array<Entity.Tag>>([])

  useEffect(() => {
    if (!router.query.account_id || !router.query.server_id) return
    const f = async () => {
      const [account, server] = await invoke<[Account, Server]>('get_account', {
        id: parseInt(router.query.account_id.toLocaleString())
      })
      const cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
      setClient(cli)
    }
    f()
  }, [router.query.server_id, router.query.account_id])

  useEffect(() => {
    if (!client) return
    const f = async () => {
      const res = await client.getFollowedTags()
      setHashtags(res.data)
    }
    f()
  }, [client])

  const back = () => {
    router.back()
  }

  const close = () => {
    router.push({ query: {} })
  }

  const openTag = (tag: string) => {
    router.push({ query: { tag: tag, server_id: router.query.server_id, account_id: router.query.account_id } })
  }

  return (
    <>
      <Header style={{ backgroundColor: 'var(--rs-border-secondary)' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={back}>
              <Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
              <FormattedMessage id="detail.back" />
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={close} title={formatMessage({ id: 'detail.close' })}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      <Content style={{ height: '100%', backgroundColor: 'var(--rs-bg-card)' }}>
        <List style={{ height: '100%' }}>
          {hashtags.map((tag, index) => (
            <List.Item key={index}>
              <div style={{ padding: '0 1.2em', cursor: 'pointer' }} onClick={() => openTag(tag.name)}>
                {tag.name}
              </div>
            </List.Item>
          ))}
        </List>
      </Content>
    </>
  )
}
