import { open } from '@tauri-apps/api/shell'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { Button, Content, Dropdown, FlexboxGrid, IconButton, Nav, Popover, useToaster, Whisper } from 'rsuite'
import { Icon } from '@rsuite/icons'
import Image from 'next/image'
import emojify from 'src/utils/emojify'
import { forwardRef, ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import alert from '../utils/alert'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { useRouter } from 'next/router'
import Posts, { FuncProps as PostsFunc } from './profile/Posts'
import Following, { FuncProps as FollowingFunc } from './profile/Following'
import Followers, { FuncProps as FollowersFunc } from './profile/Followers'

const PostsTab = forwardRef(Posts)
const FollowingTab = forwardRef(Following)
const FollowersTab = forwardRef(Followers)

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
}

const Profile: React.FC<Props> = props => {
  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [server, setServer] = useState<Server | null>(null)
  const [user, setUser] = useState<Entity.Account | null>(null)
  const [relationship, setRelationship] = useState<Entity.Relationship | null>(null)
  const [activeNav, setActiveNav] = useState<'posts' | 'following' | 'followers'>('posts')

  const toaster = useToaster()
  const router = useRouter()
  const scrollerRef = useRef<HTMLElement | null>(null)
  const postsRef = useRef<PostsFunc>()
  const followingRef = useRef<FollowingFunc>()
  const followersRef = useRef<FollowersFunc>()

  useEffect(() => {
    setUser(null)
    const f = async () => {
      let cli: MegalodonInterface
      if (router.query.account_id && router.query.server_id) {
        const [account, server] = await invoke<[Account, Server]>('get_account', {
          id: parseInt(router.query.account_id.toLocaleString())
        })
        setAccount(account)
        setServer(server)
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
    if (router.query.active_nav === 'posts' || router.query.active_nav === 'following' || router.query.active_nav === 'followers') {
      setActiveNav(router.query.active_nav)
    } else {
      setActiveNav('posts')
    }
  }, [router.query.user_id, router.query.server_id, router.query.account_id, router.query.active_nav])

  useEffect(() => {
    if (client && user) {
      loadRelationship(client, user)
    }
  }, [user, client])

  const loadRelationship = async (client: MegalodonInterface, account: Entity.Account) => {
    const res = await client.getRelationship(account.id)
    setRelationship(res.data)
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

  const changeNav = (eventKey: string) => {
    router.push({ query: Object.assign({}, router.query, { active_nav: eventKey }) })
  }

  const onScroll = async e => {
    if (scrollerRef.current) {
      const scrollBottom = scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight - e.currentTarget.scrollTop
      if (scrollBottom < 100) {
        switch (activeNav) {
          case 'posts':
            if (postsRef.current) {
              await postsRef.current.loadMore()
            }
            break
          case 'following':
            if (followingRef.current) {
              await followingRef.current.loadMore()
            }
            break
          case 'followers':
            if (followersRef.current) {
              await followersRef.current.loadMore()
            }
            break
        }
      }
    }
  }

  const timeline = useCallback(() => {
    if (!user) return <></>
    switch (activeNav) {
      case 'posts':
        return <PostsTab client={client} user={user} server={server} account={account} openMedia={props.openMedia} ref={postsRef} />
      case 'following':
        return <FollowingTab client={client} user={user} ref={followingRef} />
      case 'followers':
        return <FollowersTab client={client} user={user} ref={followersRef} />
    }
  }, [activeNav, client, user, server, account])

  return (
    user && (
      <Content
        style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)', overflowY: 'auto', overflowX: 'hidden' }}
        onScroll={onScroll}
        ref={scrollerRef}
      >
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
            <div dangerouslySetInnerHTML={{ __html: user.note }} style={{ overflow: 'hidden', wordBreak: 'break-all' }} />
          </div>
          <div
            className="fields"
            style={{
              backgroundColor: 'var(--rs-body)',
              borderRadius: '4px',
              margin: '16px 0',
              overflow: 'hidden',
              wordBreak: 'break-all'
            }}
          >
            {user.fields.map((data, index) => (
              <dl key={index} style={{ padding: '8px 16px', margin: 0, borderBottom: '1px solid var(--rs-bg-card)' }}>
                <dt>{data.name}</dt>
                <dd dangerouslySetInnerHTML={{ __html: emojify(data.value, user.emojis) }} style={{ margin: 0 }} />
              </dl>
            ))}
          </div>
        </div>
        <Nav appearance="subtle" activeKey={activeNav} onSelect={changeNav} justified>
          <Nav.Item eventKey="posts" style={{ fontWeight: 'bold' }}>
            {user.statuses_count} Posts
          </Nav.Item>
          <Nav.Item eventKey="following" style={{ fontWeight: 'bold' }}>
            {user.following_count} Following
          </Nav.Item>
          <Nav.Item eventKey="followers" style={{ fontWeight: 'bold' }}>
            {user.followers_count} Followers
          </Nav.Item>
        </Nav>
        {timeline()}
      </Content>
    )
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
