import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { BsSearch, BsPeople } from 'react-icons/bs'
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

  const search = async (word: string) => {
    const res = await props.client.search(word, { limit: 5 })
    setAccounts(res.data.accounts)
  }

  const open = (user: Entity.Account) => {
    router.push({ query: { user_id: user.id, server_id: props.server.id, account_id: props.server.account_id } })
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
          <div style={{ fontSize: '1.2em', marginBottom: '0.4em' }}>
            <Icon as={BsPeople} style={{ fontSize: '1.2em', marginRight: '0.2em' }} />
            <FormattedMessage id="search.results.accounts" />
          </div>
          <List>
            {accounts.map((account, index) => (
              <List.Item key={index} style={{ backgroundColor: 'var(--rs-border-primary)', padding: '4px 0' }}>
                <User user={account} open={open} />
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
