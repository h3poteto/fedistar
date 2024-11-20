import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Button, Modal, Radio, RadioGroup } from 'rsuite'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'

type Props = {
  next: (server: Server, account: Account) => void
}

export default function Accounts(props: Props) {
  const [accounts, setAccounts] = useState<Array<[Account, Server]>>([])
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    const f = async () => {
      const accounts = await invoke<Array<[Account, Server]>>('list_accounts')
      setAccounts(accounts)
    }
    f()
  }, [])

  return (
    <>
      <Modal.Body>
        <Modal.Title>
          <FormattedMessage id="from_other_account.accounts.title" />
        </Modal.Title>
        <div style={{ paddingTop: '2em' }}>
          <RadioGroup name="account" value={index} onChange={v => setIndex(parseInt(v.toString()))}>
            {accounts.map((account, i) => (
              <Radio key={i} value={i}>
                {account[0].username}@{account[1].domain}
              </Radio>
            ))}
          </RadioGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next(accounts[index][1], accounts[index][0])}>
          <FormattedMessage id="from_other_account.accounts.next" />
        </Button>
      </Modal.Footer>
    </>
  )
}
