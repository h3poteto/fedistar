import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { BsSearch, BsPeople, BsHash, BsChatQuote } from 'react-icons/bs'
import { FormattedMessage, useIntl } from 'react-intl'
import { Input, InputGroup, List, Avatar, Form } from 'rsuite'
import { Server } from 'src/entities/server'
import Status from 'src/components/timelines/status/Status'
import emojify from 'src/utils/emojify'
import { Account } from 'src/entities/account'
import { CustomEmojiCategory } from 'src/entities/emoji'
import { mapCustomEmojiCategory } from 'src/utils/emojiData'

type Props = {
  account: Account
  server: Server
  client: MegalodonInterface
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

export default function Results(props: Props) {
  const { formatMessage } = useIntl()
  const router = useRouter()

  const [word, setWord] = useState<string>('')
  const [accounts, setAccounts] = useState<Array<Entity.Account>>([])
  const [hashtags, setHashtags] = useState<Array<Entity.Tag>>([])
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])

  const search = async (word: string) => {
    const res = await props.client.search(word, { limit: 5, resolve: true })
    setAccounts(res.data.accounts)
    setHashtags(res.data.hashtags)
    setStatuses(res.data.statuses)
    const emojis = await props.client.getInstanceCustomEmojis()
    setCustomEmojis(mapCustomEmojiCategory(props.server.domain, emojis.data))
  }

  const loadMoreAccount = useCallback(async () => {
    const res = await props.client.search(word, { type: 'accounts', limit: 5, offset: accounts.length })
    setAccounts(prev => prev.concat(res.data.accounts))
  }, [word, accounts])

  const loadMoreHashtag = useCallback(async () => {
    const res = await props.client.search(word, { type: 'hashtags', limit: 5, offset: hashtags.length })
    setHashtags(prev => prev.concat(res.data.hashtags))
  }, [word, hashtags])

  const openUser = (user: Entity.Account) => {
    router.push({ query: { user_id: user.id, server_id: props.server.id, account_id: props.server.account_id } })
  }

  const openTag = (tag: Entity.Tag) => {
    router.push({ query: { tag: tag.name, server_id: props.server.id, account_id: props.server.account_id } })
  }

  const setStatusDetail = (statusId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { status_id: statusId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { status_id: statusId, server_id: serverId } })
    }
  }

  const setAccountDetail = (userId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { user_id: userId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { user_id: userId, server_id: serverId } })
    }
  }

  const setTagDetail = (tag: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { tag: tag, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { tag: tag, server_id: serverId } })
    }
  }

  const updateStatus = (status: Entity.Status) => {
    const renew = statuses.map(s => {
      if (s.id === status.id) {
        return status
      } else if (s.reblog && s.reblog.id === status.id) {
        return Object.assign({}, s, { reblog: status })
      } else if (status.reblog && s.id === status.reblog.id) {
        return status.reblog
      } else if (status.reblog && s.reblog && s.reblog.id === status.reblog.id) {
        return Object.assign({}, s, { reblog: status.reblog })
      } else {
        return s
      }
    })
    setStatuses(renew)
  }

  return (
    <>
      <div style={{ margin: '12px 0' }}>
        <Form onCheck={() => search(word)}>
          <InputGroup inside>
            <Input placeholder={formatMessage({ id: 'search.placeholder' })} value={word} onChange={value => setWord(value)} />
            <InputGroup.Button onClick={() => search(word)}>
              <Icon as={BsSearch} />
            </InputGroup.Button>
          </InputGroup>
        </Form>
      </div>
      {/* accounts */}
      {accounts.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '1.2em', margin: '0.4em 0' }}>
            <Icon as={BsPeople} style={{ fontSize: '1.2em', marginRight: '0.2em' }} />
            <FormattedMessage id="search.results.accounts" />
          </div>
          <List>
            {accounts.map((account, index) => (
              <List.Item key={index} style={{ backgroundColor: 'var(--rs-border-primary)', padding: '4px 0' }}>
                <User user={account} open={openUser} />
              </List.Item>
            ))}
            <List.Item
              key="more"
              style={{ backgroundColor: 'var(--rs-border-primary)', padding: '1em 0', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => loadMoreAccount()}
            >
              <FormattedMessage id="search.results.more" />
            </List.Item>
          </List>
        </div>
      )}
      {/* hashtags */}
      {hashtags.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '1.2em', margin: '0.4em 0' }}>
            <Icon as={BsHash} style={{ fontSize: '1.2em', marginRight: '0.2em' }} />
            <FormattedMessage id="search.results.hashtags" />
          </div>
          <List>
            {hashtags.map((tag, index) => (
              <List.Item key={index} style={{ backgroundColor: 'var(--rs-border-primary)', padding: '4px 0' }}>
                <div style={{ padding: '12px 8px', cursor: 'pointer' }} onClick={() => openTag(tag)}>
                  #{tag.name}
                </div>
              </List.Item>
            ))}
            <List.Item
              key="more"
              style={{ backgroundColor: 'var(--rs-border-primary)', padding: '1em 0', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => loadMoreHashtag()}
            >
              <FormattedMessage id="search.results.more" />
            </List.Item>
          </List>
        </div>
      )}
      {/* statuses */}
      {statuses.length > 0 && (
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '1.2em', margin: '0.4em 0' }}>
            <Icon as={BsChatQuote} style={{ fontSize: '1.2em', marginRight: '0.2em' }} />
            <FormattedMessage id="search.results.statuses" />
          </div>
          <List>
            {statuses.map((status, index) => (
              <List.Item key={index} style={{ backgroundColor: 'var(--rs-border-primary)', padding: '4px 0' }}>
                <div style={{ padding: '12px 8px', cursor: 'pointer' }}>
                  <Status
                    status={status}
                    client={props.client}
                    server={props.server}
                    account={props.account}
                    columnWidth="xs"
                    updateStatus={updateStatus}
                    openMedia={props.openMedia}
                    setStatusDetail={setStatusDetail}
                    setAccountDetail={setAccountDetail}
                    setTagDetail={setTagDetail}
                    openReport={props.openReport}
                    openFromOtherAccount={props.openFromOtherAccount}
                    customEmojis={customEmojis}
                  />
                </div>
              </List.Item>
            ))}
          </List>
        </div>
      )}
    </>
  )
}

type UserProps = {
  user: Entity.Account
  open: (user: Entity.Account) => void
}

const User: React.FC<UserProps> = props => {
  const { user, open } = props

  return (
    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => open(user)}>
      {/** icon **/}
      <div style={{ width: '56px' }}>
        <div style={{ margin: '6px' }}>
          <Avatar src={user.avatar} />
        </div>
      </div>
      {/** name **/}
      <div style={{ paddingRight: '8px', width: 'cac(100% - 56px)', overflow: 'hidden' }}>
        <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span dangerouslySetInnerHTML={{ __html: emojify(user.display_name, user.emojis) }} />
        </div>
        <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--rs-text-tertiary)' }}>@{user.acct}</span>
        </div>
      </div>
    </div>
  )
}
