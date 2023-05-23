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
import { Server, ServerSet } from '../../entities/server'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity } from 'megalodon'
import { Account } from 'src/entities/account'
import { TimelineKind } from 'src/entities/timeline'
import { Instruction } from 'src/entities/instruction'
import { listen } from '@tauri-apps/api/event'
import { TFunction } from 'i18next'

type AuthorizedProps = {
  server: Server
  select: (kind: TimelineKind, name: string, list_id: string | null) => void
  t: TFunction<'translation', undefined, 'translation'>
}

const AuthorizedTimelines: React.FC<AuthorizedProps> = props => {
  const { t } = props

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
    <>
      <List.Item index={3} onClick={() => select('home', 'Home', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsHouseDoor} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>{t('timeline.home')}</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={4} onClick={() => select('notifications', 'Notifications', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsBell} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>{t('timeline.notifications')}</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={5} onClick={() => select('favourites', 'Favourites', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsStar} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>{t('timeline.favourites')}</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={6} onClick={() => select('bookmarks', 'Bookmarks', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsBookmark} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>{t('timeline.bookmarks')}</div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </List.Item>
      <List.Item index={7} onClick={() => select('direct', 'Direct messages', null)} style={{ cursor: 'pointer' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Icon as={BsEnvelope} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <div>{t('timeline.direct')}</div>
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
    </>
  )
}

type Props = {
  servers: Array<ServerSet>
  t: TFunction<'translation', undefined, 'translation'>
}

const New: React.FC<Props> = props => {
  const { t } = props

  const [server, setServer] = useState<Server | null>(null)
  const [walkthrough, setWalkthrough] = useState<boolean>(false)

  useEffect(() => {
    listen<Instruction>('updated-instruction', event => {
      if (event.payload.instruction < 1) {
        setWalkthrough(true)
      } else {
        setWalkthrough(false)
      }
    })
    const f = async () => {
      try {
        const instruction = await invoke<Instruction>('get_instruction')
        if (instruction.instruction < 1) {
          setWalkthrough(true)
        } else {
          setWalkthrough(false)
        }
      } catch (err) {
        console.log(err)
      }
    }
    f()
  }, [])

  const addTimelineMenu = ({ onClose, left, top, className }, ref: any) => {
    const handleSelect = (eventKey: string) => {
      onClose()
      const target = props.servers.find(s => s.server.id === parseInt(eventKey))
      setServer(target.server)
    }
    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          {props.servers.map(server => (
            <Dropdown.Item eventKey={server.server.id} key={server.server.id}>
              {server.account ? server.account.username + '@' + server.server.domain : server.server.domain}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Popover>
    )
  }

  const closeWalkthrough = async () => {
    setWalkthrough(false)
    await invoke('update_instruction', { step: 1 })
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
      {walkthrough && (
        <div style={{ position: 'relative' }}>
          <Popover arrow={false} visible={walkthrough} style={{ left: 0, top: 30 }}>
            <div style={{ width: '120px' }}>
              <h4 style={{ fontSize: '1.2em' }}>{t('walkthrough.timeline.new.title')}</h4>
              <p>{t('walkthrough.timeline.new.description')}</p>
            </div>
            <FlexboxGrid justify="end">
              <Button appearance="default" size="xs" onClick={closeWalkthrough}>
                {t('walkthrough.timeline.new.ok')}
              </Button>
            </FlexboxGrid>
          </Popover>
        </div>
      )}
      <ButtonToolbar>
        <Whisper placement="bottom" delay={100} preventOverflow trigger="click" speaker={addTimelineMenu} onOpen={closeWalkthrough}>
          <IconButton icon={<Icon as={BsPlus} />} size="lg" appearance="ghost" title={t('timeline.new')} />
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
    <div className="add-timeline" style={{ width: '240px', minWidth: '240px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Container style={{ height: '100%' }}>
        <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item style={{ paddingLeft: '8px', lineHeight: '52px' }}>@{server.domain}</FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <Button appearance="link" onClick={back} title={t('timeline.back')}>
                <Icon as={BsChevronLeft} />
                {t('timeline.back')}
              </Button>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>
        <Content className="timeline-scrollable" style={{ height: 'calc(100% - 54px)' }}>
          <List hover>
            <List.Item index={1} onClick={() => select('local', 'Local', null)} style={{ cursor: 'pointer' }}>
              <FlexboxGrid align="middle">
                <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon as={BsPeople} />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={20}>
                  <div>{t('timeline.local')}</div>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
            <List.Item index={2} onClick={() => select('public', 'Federated', null)} style={{ cursor: 'pointer' }}>
              <FlexboxGrid align="middle">
                <FlexboxGrid.Item colspan={4} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon as={BsGlobe2} />
                </FlexboxGrid.Item>
                <FlexboxGrid.Item colspan={20}>
                  <div>{t('timeline.public')}</div>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </List.Item>
            {server.account_id && <AuthorizedTimelines server={server} select={select} t={t} />}
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
