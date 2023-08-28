import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import { BsSearch, BsPeople, BsHash } from 'react-icons/bs'
import { FormattedMessage, useIntl } from 'react-intl'
import { Input, InputGroup, List, Avatar } from 'rsuite'
import { Server } from 'src/entities/server'
import emojify from 'src/utils/emojify'

type Props = {
  server: Server
  client: MegalodonInterface
}

export default function Results(props: Props) {
  const { formatMessage } = useIntl()
  const router = useRouter()

  const [word, setWord] = useState<string>('')
  const [accounts, setAccounts] = useState<Array<Entity.Account>>([])
  const [hashtags, setHashtags] = useState<Array<Entity.Tag>>([])

  const search = async (word: string) => {
    const res = await props.client.search(word, { limit: 5 })
    setAccounts(res.data.accounts)
    setHashtags(res.data.hashtags)
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

  return (
    <>
      <div style={{ margin: '12px 0' }}>
        <InputGroup inside>
          <Input placeholder={formatMessage({ id: 'search.placeholder' })} value={word} onChange={value => setWord(value)} />
          <InputGroup.Button onClick={() => search(word)}>
            <Icon as={BsSearch} />
          </InputGroup.Button>
        </InputGroup>
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
