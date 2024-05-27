import { open } from '@tauri-apps/api/shell'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { BsThreeDotsVertical, BsChevronLeft, BsX } from 'react-icons/bs'
import { Button, Content, Dropdown, FlexboxGrid, IconButton, Nav, Popover, useToaster, Whisper, Header } from 'rsuite'
import { Icon } from '@rsuite/icons'
import Image from 'next/image'
import emojify from 'src/utils/emojify'
import { forwardRef, MouseEventHandler, ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import alert from '../utils/alert'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { useRouter } from 'next/router'
import Posts, { FuncProps as PostsFunc } from './profile/Posts'
import Following, { FuncProps as FollowingFunc } from './profile/Following'
import Followers, { FuncProps as FollowersFunc } from './profile/Followers'
import { findLink } from 'src/utils/statusParser'
import { domainFromAcct } from 'src/utils/domain'
import { FormattedMessage, useIntl } from 'react-intl'

const PostsTab = forwardRef(Posts)
const FollowingTab = forwardRef(Following)
const FollowersTab = forwardRef(Followers)

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
  openAddListMember: (user: Entity.Account, client: MegalodonInterface) => void
}

const Profile: React.FC<Props> = props => {
  const { openAddListMember } = props
  const { formatMessage } = useIntl()

  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [myself, setMyself] = useState<Entity.Account | null>(null)
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
        const u = await cli.verifyAccountCredentials()
        setMyself(u.data)
      } else if (router.query.server_id) {
        const server = await invoke<Server>('get_server', { id: parseInt(router.query.server_id.toString()) })
        setAccount(null)
        setServer(server)
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
    if (client && user && account) {
      loadRelationship(client, user)
    }
  }, [user, client, account])

  const loadRelationship = async (client: MegalodonInterface, account: Entity.Account) => {
    const res = await client.getRelationship(account.id)
    setRelationship(res.data)
  }

  const back = () => {
    router.back()
  }

  const close = () => {
    router.push({ query: {} })
  }

  const follow = useCallback(async () => {
    try {
      const res = await client.followAccount(user.id)
      setRelationship(res.data)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', formatMessage({ id: 'alert.failed_follow' })), { placement: 'topEnd' })
    }
  }, [client, account, user])

  const unfollow = useCallback(async () => {
    try {
      const res = await client.unfollowAccount(user.id)
      setRelationship(res.data)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', formatMessage({ id: 'alert.failed_unfollow' })), { placement: 'topEnd' })
    }
  }, [client, account, user])

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
        return (
          <PostsTab
            client={client}
            user={user}
            server={server}
            account={account}
            openMedia={props.openMedia}
            openReport={props.openReport}
            openFromOtherAccount={props.openFromOtherAccount}
            ref={postsRef}
          />
        )
      case 'following':
        return <FollowingTab client={client} user={user} account={account} ref={followingRef} />
      case 'followers':
        return <FollowersTab client={client} user={user} account={account} ref={followersRef} />
    }
  }, [activeNav, client, user, server, account])

  const onClick: MouseEventHandler<HTMLDivElement> = async e => {
    const url = findLink(e.target as HTMLElement, 'status-body')
    if (url) {
      open(url)
      e.preventDefault()
      e.stopPropagation()
    }
    return false
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

      {user && (
        <Content
          style={{ height: '100%', backgroundColor: 'var(--rs-bg-card)', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
          className="timeline-scrollable"
          onScroll={onScroll}
          ref={scrollerRef}
        >
          {relationship && relationship.followed_by && (
            <div
              className="followed-status"
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <FormattedMessage id="detail.profile.follows_you" />
            </div>
          )}
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
                  <FlexboxGrid.Item>
                    <FollowButton relationship={relationship} follow={follow} unfollow={unfollow} myself={myself} user={user} />
                  </FlexboxGrid.Item>
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
                            myself,
                            user,
                            relationship,
                            onChange: () => {
                              loadRelationship(client, user)
                            },
                            openAddListMember
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
              <div
                dangerouslySetInnerHTML={{ __html: user.note }}
                style={{ overflow: 'hidden', wordBreak: 'break-word' }}
                onClick={onClick}
              />
            </div>
            <div
              className="fields"
              style={{
                backgroundColor: 'var(--rs-body)',
                borderRadius: '4px',
                margin: '16px 0',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }}
              onClick={onClick}
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
            <Nav.Item eventKey="posts" style={{ fontWeight: 'bold', padding: '6px 8px' }}>
              {precision(user.statuses_count)} <FormattedMessage id="detail.profile.posts" />
            </Nav.Item>
            <Nav.Item eventKey="following" style={{ fontWeight: 'bold', padding: '6px 8px' }}>
              {precision(user.following_count)} <FormattedMessage id="detail.profile.following" />
            </Nav.Item>
            <Nav.Item eventKey="followers" style={{ fontWeight: 'bold', padding: '6px 8px' }}>
              {precision(user.followers_count)} <FormattedMessage id="detail.profile.followers" />
            </Nav.Item>
          </Nav>
          {timeline()}
        </Content>
      )}
    </>
  )
}

type ProfileMenuProps = {
  className: string
  left?: number
  top?: number
  onClose: (delay?: number) => NodeJS.Timeout | void
  client: MegalodonInterface
  myself: Entity.Account
  user: Entity.Account
  relationship: Entity.Relationship | null
  onChange: () => void
  openAddListMember: (user: Entity.Account, client: MegalodonInterface) => void
}

const profileMenu = (
  { className, left, top, onClose, client, myself, user, relationship, onChange, openAddListMember }: ProfileMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const domain = domainFromAcct(user.acct)

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
      case 'list_management': {
        openAddListMember(user, client)
        return
      }
      case 'domain_block': {
        if (relationship.domain_blocking) {
          await client.unblockDomain(domain)
        } else {
          await client.blockDomain(domain)
        }
        onChange()
        return
      }
    }
  }
  return (
    <Popover ref={ref} className={className} style={{ left, top, padding: '0 4px' }}>
      <Dropdown.Menu onSelect={handleSelect}>
        <Dropdown.Item eventKey="browser">
          <FormattedMessage id="detail.profile.open_page" />
        </Dropdown.Item>
        {relationship && (
          <>
            <Dropdown.Separator />
            <Dropdown.Item eventKey="mute" disabled={myself.acct === user.acct}>
              {relationship.muting ? (
                <FormattedMessage id="detail.profile.unmute" values={{ user: `@${user.username}` }} />
              ) : (
                <FormattedMessage id="detail.profile.mute" values={{ user: `@${user.username}` }} />
              )}
            </Dropdown.Item>
            <Dropdown.Item eventKey="block" disabled={myself.acct === user.acct}>
              {relationship.blocking ? (
                <FormattedMessage id="detail.profile.unblock" values={{ user: `@${user.username}` }} />
              ) : (
                <FormattedMessage id="detail.profile.block" values={{ user: `@${user.username}` }} />
              )}
            </Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item eventKey="list_management">
              <FormattedMessage id="detail.profile.list_management" />
            </Dropdown.Item>
            {domain && (
              <>
                <Dropdown.Separator />
                <Dropdown.Item eventKey="domain_block" disabled={myself.acct === user.acct}>
                  {relationship.domain_blocking ? (
                    <FormattedMessage id="detail.profile.unblock_domain" values={{ server: domain }} />
                  ) : (
                    <FormattedMessage id="detail.profile.block_domain" values={{ server: domain }} />
                  )}
                </Dropdown.Item>
              </>
            )}
          </>
        )}
      </Dropdown.Menu>
    </Popover>
  )
}

const precision = (num: number): string => {
  if (num > 1000) {
    return `${(num / 1000).toPrecision(3)}K`
  } else if (num > 1000000) {
    return `${(num / 1000000).toPrecision(3)}M`
  } else {
    return num.toString()
  }
}

type FollowButtonProps = {
  relationship: Entity.Relationship
  myself: Entity.Account
  user: Entity.Account
  follow: () => Promise<void>
  unfollow: () => Promise<void>
}

const FollowButton: React.FC<FollowButtonProps> = props => {
  const { formatMessage } = useIntl()
  const [followMessage, setFollowMessage] = useState(formatMessage({ id: 'detail.profile.not_following' }))
  const [followColor, setFollowColor] = useState<'default' | 'primary'>('default')
  const [unfollowMessage, setUnfollowMessage] = useState(formatMessage({ id: 'detail.profile.following' }))
  const [unfollowColor, setUnfollowColor] = useState<'blue' | 'red'>('blue')

  if (!props.relationship) {
    return null
  }
  if (props.user.acct === props.myself.acct) {
    return null
  }
  if (props.relationship.following) {
    return (
      <Button
        appearance="primary"
        color={unfollowColor}
        onClick={props.unfollow}
        onMouseEnter={() => {
          setUnfollowMessage(formatMessage({ id: 'detail.profile.unfollow' }))
          setUnfollowColor('red')
        }}
        onMouseLeave={() => {
          setUnfollowMessage(formatMessage({ id: 'detail.profile.following' }))
          setUnfollowColor('blue')
        }}
        block
      >
        {unfollowMessage}
      </Button>
    )
  } else if (props.relationship.requested) {
    return <Button appearance="primary">{formatMessage({ id: 'detail.profile.follow_requested' })}</Button>
  } else {
    return (
      <Button
        appearance={followColor}
        onClick={props.follow}
        onMouseEnter={() => {
          setFollowMessage(formatMessage({ id: 'detail.profile.follow' }))
          setFollowColor('primary')
        }}
        onMouseLeave={() => {
          setFollowMessage(formatMessage({ id: 'detail.profile.not_following' }))
          setFollowColor('default')
        }}
      >
        {followMessage}
      </Button>
    )
  }
}

export default Profile
