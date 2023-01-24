import { open } from '@tauri-apps/api/shell'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { BsX, BsThreeDotsVertical } from 'react-icons/bs'
import { Button, Container, Content, Dropdown, FlexboxGrid, Header, IconButton, Popover, useToaster, Whisper } from 'rsuite'
import { Icon } from '@rsuite/icons'
import Image from 'next/image'
import emojify from 'src/utils/emojify'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import alert from '../utils/alert'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { useRouter } from 'next/router'

type Props = {}

const Profile: React.FC<Props> = () => {
  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [user, setUser] = useState<Entity.Account | null>(null)
  const [relationship, setRelationship] = useState<Entity.Relationship | null>(null)

  const toaster = useToaster()
  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      let cli: MegalodonInterface
      if (router.query.account_id && router.query.server_id) {
        const [account, server] = await invoke<[Account, Server]>('get_account', {
          id: parseInt(router.query.account_id.toLocaleString())
        })
        setAccount(account)
        cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
        setClient(cli)
      } else if (router.query.server_id) {
        const server = await invoke<Server>('get_server', { id: parseInt(router.query.server_id.toString()) })
        setAccount(null)
        cli = generator(server.sns, server.base_url, undefined, 'Fedistar')
        setClient(cli)
      }
      if (router.query.user_id) {
        const res = await cli.getAccount(router.query.user_id.toString())
        setUser(res.data)
      }
    }
    f()
  }, [router.query.user_id, router.query.server_id, router.query.account_id])

  useEffect(() => {
    if (client && user) {
      loadRelationship(client, user)
    }
  }, [user, client])

  const loadRelationship = async (client: MegalodonInterface, account: Entity.Account) => {
    const res = await client.getRelationship(account.id)
    setRelationship(res.data)
  }

  const close = () => {
    router.push({ query: {} })
  }

  const followButton = () => {
    if (!relationship) {
      return null
    }
    if (relationship.following) {
      return (
        <Button appearance="primary" onClick={unfollow}>
          Unfollow
        </Button>
      )
    } else if (relationship.requested) {
      return <Button appearance="primary">Follow Requested</Button>
    } else {
      return (
        <Button appearance="primary" onClick={follow}>
          Follow
        </Button>
      )
    }
  }

  const follow = useCallback(async () => {
    try {
      const res = await client.followAccount(user.id)
      setRelationship(res.data)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', 'Failed to follow'), { placement: 'topEnd' })
    }
  }, [client, account])

  const unfollow = useCallback(async () => {
    try {
      const res = await client.unfollowAccount(user.id)
      setRelationship(res.data)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', 'Failed to unfollow'), { placement: 'topEnd' })
    }
  }, [client, account])

  return (
    <Container className="profile" style={{ height: '100%', borderLeft: '1px solid var(--rs-gray-600)' }}>
      <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
        <Button appearance="link" onClick={close}>
          <Icon as={BsX} style={{ fontSize: '1.4em' }} />
        </Button>
      </Header>
      {user && (
        <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)' }}>
          <div className="profile-header-image" style={{ width: '100%', backgroundColor: 'var(--rs-body)' }}>
            <img src={user.header} alt="header image" style={{ objectFit: 'cover', width: '100%', height: '146px' }} />
          </div>
          <div className="profile-header-body" style={{ padding: '0 20px' }}>
            <FlexboxGrid justify="space-between" align="bottom" style={{ marginTop: '-50px' }}>
              <FlexboxGrid.Item>
                <Image src={user.avatar} alt={user.acct} width={94} height={94} style={{ borderRadius: '4px' }} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <FlexboxGrid style={{ gap: '8px' }}>
                  <FlexboxGrid.Item>{followButton()}</FlexboxGrid.Item>
                  <FlexboxGrid.Item>
                    <Whisper
                      placement="bottomEnd"
                      controlId="control-id-profile-detail"
                      trigger="click"
                      speaker={({ className, left, top, onClose }, ref) =>
                        profileMenu(
                          {
                            className,
                            left,
                            top,
                            onClose,
                            client,
                            user,
                            relationship,
                            onChange: () => {
                              loadRelationship(client, user)
                            }
                          },
                          ref
                        )
                      }
                    >
                      <IconButton icon={<Icon as={BsThreeDotsVertical} />} />
                    </Whisper>
                  </FlexboxGrid.Item>
                </FlexboxGrid>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            <div className="username" style={{ margin: '16px 0' }}>
              <span
                style={{ fontSize: '1.2em', fontWeight: 'bold', display: 'block' }}
                dangerouslySetInnerHTML={{ __html: emojify(user.display_name, user.emojis) }}
              ></span>
              <span style={{ display: 'block', color: 'var(--rs-text-secondary)' }}>@{user.acct}</span>
            </div>
            <div className="bio">
              <div dangerouslySetInnerHTML={{ __html: user.note }} />
            </div>
            <div className="fields" style={{ backgroundColor: 'var(--rs-body)', borderRadius: '4px', margin: '16px 0' }}>
              {user.fields.map((data, index) => (
                <dl key={index} style={{ padding: '8px 16px', margin: 0, borderBottom: '1px solid var(--rs-bg-card)' }}>
                  <dt>{data.name}</dt>
                  <dd dangerouslySetInnerHTML={{ __html: emojify(data.value, user.emojis) }} style={{ margin: 0 }} />
                </dl>
              ))}
            </div>
            <FlexboxGrid className="status" justify="space-between">
              <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{user.statuses_count} Posts</FlexboxGrid.Item>
              <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{user.following_count} Following</FlexboxGrid.Item>
              <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{user.followers_count} Followers</FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
        </Content>
      )}
    </Container>
  )
}

type ProfileMenuProps = {
  className: string
  left?: number
  top?: number
  onClose: (delay?: number) => NodeJS.Timeout | void
  client: MegalodonInterface
  user: Entity.Account
  relationship: Entity.Relationship | null
  onChange: () => void
}

const profileMenu = (
  { className, left, top, onClose, client, user, relationship, onChange }: ProfileMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const handleSelect = async (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case 'browser': {
        open(user.url)
        return
      }
      case 'mute': {
        if (relationship.muting) {
          await client.unmuteAccount(user.id)
        } else {
          await client.muteAccount(user.id, false)
        }
        onChange()
        return
      }
      case 'block': {
        if (relationship.blocking) {
          await client.unblockAccount(user.id)
        } else {
          await client.blockAccount(user.id)
        }
        onChange()
        return
      }
    }
  }
  return (
    <Popover ref={ref} className={className} style={{ left, top, padding: '0 4px' }}>
      <Dropdown.Menu onSelect={handleSelect}>
        <Dropdown.Item eventKey="browser">Open original page</Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item eventKey="mute">
          {relationship.muting ? 'Unmute' : 'Mute'} @{user.username}
        </Dropdown.Item>
        <Dropdown.Item eventKey="block">
          {relationship.blocking ? 'Unblock' : 'Block'} @{user.username}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

export default Profile
