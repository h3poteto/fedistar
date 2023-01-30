import {
  Popover,
  Dropdown,
  ButtonToolbar,
  Whisper,
  IconButton,
  List,
  FlexboxGrid,
  Loader,
  Container,
  Header,
  Content,
  Button
} from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsPlus, BsHouseDoor, BsBell, BsPeople, BsGlobe2, BsStar, BsListUl, BsChevronLeft, BsBookmark, BsEnvelope } from 'react-icons/bs'
import { Server } from '../../entities/server'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity } from 'megalodon'
import { Account } from 'src/entities/account'
import { TimelineKind } from 'src/entities/timeline'

type AuthorizedProps = {
  server: Server
  select: (kind: TimelineKind, name: string, list_id: string | null) => void
}

const AuthorizedTimelines: React.FC<AuthorizedProps> = props => {
  const [loading, setLoading] = useState<boolean>(false)
  const [lists, setLists] = useState<Array<Entity.List>>([])
  const { server, select } = props

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      try {
        const [account, _] = await invoke<[Account, Server]>('get_account', { id: server.account_id })
        const client = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
        const res = await client.getLists()
        setLists(res.data)
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [server])

  return (
    <div>
      <List.Item index={3} onClick={() => select('home', 'Home', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsHouseDoor} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>Home</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={4} onClick={() => select('notifications', 'Notifications', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsBell} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>Notifications</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={5} onClick={() => select('favourites', 'Favourites', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsStar} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>Favourites</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={6} onClick={() => select('bookmarks', 'Bookmarks', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsBookmark} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>Bookmarks</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={7} onClick={() => select('direct', 'Direct messages', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsEnvelope} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>Direct messages</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      {loading && (
        <List.Item index={8}>
          <Loader />
        </List.Item>
      )}
      {lists.map((list, index) => (
        <List.Item key={index} index={8 + index} onClick={() => select('list', list.title, list.id)} style={{ cursor: 'pointer' }}>
          <FlexboxGrid align="middle">
            <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Icon as={BsListUl} />
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={20}>
              <div>{list.title}</div>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </List.Item>
      ))}
    </div>
  )
}

type Props = {
  servers: Array<Server>
}

const New: React.FC<Props> = props => {
  const [server, setServer] = useState<Server | null>(null)

  const addTimelineMenu = ({ onClose, left, top, className }, ref: any) => {
    const handleSelect = (eventKey: string) => {
      onClose()
      const target = props.servers.find(s => s.id === parseInt(eventKey))
      setServer(target)
    }
    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          {props.servers.map(server => (
            <Dropdown.Item eventKey={server.id} key={server.id}>
              {server.domain}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Popover>
    )
  }

  const addButton = () => (
    <div
      className="add-timeline"
      style={{
        width: '240px',
        minWidth: '240px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <ButtonToolbar>
        <Whisper placement="bottomStart" trigger="click" speaker={addTimelineMenu}>
          <IconButton icon={<Icon as={BsPlus} />} size="lg" appearance="ghost" title="Add a new timeline" />
        </Whisper>
      </ButtonToolbar>
    </div>
  )

  const select = async (tl: TimelineKind, name: string, list_id: string | null) => {
    await invoke('add_timeline', { server: server, kind: tl, name: name, listId: list_id })
    setServer(null)
  }

  const back = async () => {
    setServer(null)
  }

  const selectTimeline = () => (
    <div className="add-timeline" style={{ width: '240px', minWidth: '240px', display: 'flex', flexDirection: 'column' }}>
      <Container>
        <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item style={{ paddingLeft: '8px', lineHeight: '52px' }}>@{server.domain}</FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <Button appearance="link" onClick={back} title="back">
                <Icon as={BsChevronLeft} />
                Back
              </Button>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>
        <Content>
          <List hover>
            <List.Item index={1} onClick={() => select('local', 'Local', null)} style={{ cursor: 'pointer' }}>
              <FlexboxGrid align="middle">
                <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon as={BsPeople} />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={20}>
                  <div>Local</div>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
            <List.Item index={2} onClick={() => select('public', 'Federated', null)} style={{ cursor: 'pointer' }}>
              <FlexboxGrid align="middle">
                <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon as={BsGlobe2} />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={20}>
                  <div>Federated</div>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
            {server.account_id && <AuthorizedTimelines server={server} select={select} />}
          </List>
        </Content>
      </Container>
    </div>
  )

  if (server === null) {
    return addButton()
  } else {
    return selectTimeline()
  }
}

export default New
