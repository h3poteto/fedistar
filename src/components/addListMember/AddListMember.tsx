import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useCallback, useEffect, useState } from 'react'
import { BsListUl, BsPlusLg, BsXLg } from 'react-icons/bs'
import { Modal, HStack, Avatar, List, Button } from 'rsuite'
import emojify from 'src/utils/emojify'

type Props = {
  opened: boolean
  user: Entity.Account
  client: MegalodonInterface
  close: () => void
}

export default function AddListMember(props: Props) {
  const { user, close, client } = props

  const [lists, setLists] = useState<Array<Entity.List>>([])
  const [accountLists, setAccountLists] = useState<{ [key: string]: Entity.List }>({})

  useEffect(() => {
    if (!client || !user) return
    const f = async () => {
      await reload(user, client)
    }
    f()
  }, [user, client])

  const reload = async (user: Entity.Account, client: MegalodonInterface) => {
    const l = await client.getLists()
    setLists(l.data)
    const a = await client.getAccountLists(user.id)
    let obj = {}
    a.data.map(list => {
      obj = Object.assign({}, obj, {
        [list.id]: list
      })
      return list
    })
    setAccountLists(obj)
  }

  const add = useCallback(
    async (list: Entity.List) => {
      await client.addAccountsToList(list.id, [user.id])
      await reload(user, client)
    },
    [user, client]
  )

  const remove = useCallback(
    async (list: Entity.List) => {
      await client.deleteAccountsFromList(list.id, [user.id])
      await reload(user, client)
    },
    [user, client]
  )

  return (
    <>
      {user && (
        <Modal size="xs" open={props.opened} onClose={() => close()}>
          <Modal.Header>
            <HStack>
              {/** icon **/}
              <div style={{ margin: '6px' }}>
                <Avatar src={user.avatar} />
              </div>
              {/** name **/}
              <HStack.Item grow={1} style={{ overflow: 'hidden' }}>
                <div>
                  <span dangerouslySetInnerHTML={{ __html: emojify(user.display_name, user.emojis) }} />
                </div>
                <div>
                  <span style={{ color: 'var(--rs-text-tertiary)' }}>@{user.acct}</span>
                </div>
              </HStack.Item>
            </HStack>
          </Modal.Header>
          <Modal.Body>
            <List>
              {lists.map((list, index) => (
                <List.Item key={index}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.6em' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Icon as={BsListUl} />
                      <div style={{ paddingLeft: '0.8em' }}>{list.title}</div>
                    </div>
                    {accountLists[list.id] ? (
                      <Button appearance="link" style={{ padding: 0 }} onClick={() => remove(list)}>
                        <Icon as={BsXLg} />
                      </Button>
                    ) : (
                      <Button appearance="link" style={{ padding: 0 }} onClick={() => add(list)}>
                        <Icon as={BsPlusLg} />
                      </Button>
                    )}
                  </div>
                </List.Item>
              ))}
            </List>
          </Modal.Body>
        </Modal>
      )}
    </>
  )
}
