import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { Modal } from 'rsuite'
import { USER_AGENT } from 'src/defaults'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import Accounts from './Accounts'
import Status from './Status'

type Props = {
  opened: boolean
  status: Entity.Status
  close: () => void
}

export default function FromOtherAccount(props: Props) {
  const { t } = useTranslation('common')

  const [server, setServer] = useState<Server | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [client, setClient] = useState<MegalodonInterface | null>(null)

  useEffect(() => {
    if (server === null || account === null) {
      return
    }
    const cli = generator(server.sns, server.base_url, account.access_token, USER_AGENT)
    setClient(cli)
  }, [server, account])

  const reset = () => {
    setServer(null)
    setAccount(null)
    setClient(null)
  }

  const body = () => {
    if (!server || !account) {
      return (
        <Accounts
          next={(server: Server, account: Account) => {
            setServer(server)
            setAccount(account)
          }}
        />
      )
    } else {
      return (
        <Status
          client={client}
          account={account}
          server={server}
          target={props.status}
          next={() => {
            reset()
            props.close()
          }}
        />
      )
    }
  }

  if (props.status) {
    return (
      <Modal
        size="sm"
        open={props.opened}
        onClose={() => {
          reset()
          props.close()
        }}
      >
        <Modal.Header>{t('from_other_account.title')}</Modal.Header>
        {body()}
      </Modal>
    )
  } else {
    return <></>
  }
}
