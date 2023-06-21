import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsX } from 'react-icons/bs'
import { Avatar, Button, FlexboxGrid, List, Modal } from 'rsuite'
import emojify from 'src/utils/emojify'

type Props = {
  opened: boolean
  list: Entity.List
  client: MegalodonInterface
  close: () => void
}

export default function ListMemberships(props: Props) {
  const { t } = useTranslation()

  const [accounts, setAccounts] = useState<Array<Entity.Account>>([])

  useEffect(() => {
    if (props.list && props.client) {
      const f = async () => {
        await reload(props.list.id)
      }
      f()
    }
  }, [props.list, props.client])

  const reload = async (listID: string) => {
    const res = await props.client.getAccountsInList(listID)
    setAccounts(res.data)
  }

  const remove = async (account: Entity.Account) => {
    await props.client.deleteAccountsFromList(props.list.id, [account.id])
    await reload(props.list.id)
  }

  return (
    <Modal
      size="xs"
      open={props.opened}
      onClose={() => {
        props.close()
      }}
    >
      <Modal.Header>{t('list_memberships.title')}</Modal.Header>
      <Modal.Body>
        <div>
          <List className="timeline-scrollable">
            {accounts.map((account, index) => (
              <List.Item key={index} style={{ padding: 0 }}>
                <FlexboxGrid align="middle">
                  {/** icon **/}
                  <FlexboxGrid.Item colspan={4}>
                    <div style={{ margin: '6px' }}>
                      <Avatar src={account.avatar} />
                    </div>
                  </FlexboxGrid.Item>
                  {/** name **/}
                  <FlexboxGrid.Item colspan={17}>
                    <div>
                      <span dangerouslySetInnerHTML={{ __html: emojify(account.display_name, account.emojis) }} />
                    </div>
                    <div>
                      <span style={{ color: 'var(--rs-text-tertiary)' }}>@{account.acct}</span>
                    </div>
                  </FlexboxGrid.Item>
                  <FlexboxGrid.Item colspan={3}>
                    <Button appearance="link" size="lg" onClick={() => remove(account)}>
                      <Icon as={BsX} style={{ fontSize: '1.4em', color: 'var(--rs-text-tertiary)' }} />
                    </Button>
                  </FlexboxGrid.Item>
                </FlexboxGrid>
              </List.Item>
            ))}
          </List>
        </div>
      </Modal.Body>
    </Modal>
  )
}
