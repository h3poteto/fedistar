import { useState, useEffect, useReducer, CSSProperties } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Container, Content, useToaster, Animation } from 'rsuite'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'
import dayjs from 'dayjs'

import { Server, ServerSet } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import { Unread } from 'src/entities/unread'
import alert from 'src/components/utils/alert'
import NewTimeline from 'src/components/timelines/New'
import ShowTimeline from 'src/components/timelines/Show'
import NewServer from 'src/components/servers/New'
import Navigator from 'src/components/Navigator'
import Compose from 'src/components/compose/Compose'
import Media from 'src/components/Media'
import generateNotification from 'src/utils/notification'
import { ReceiveNotificationPayload } from 'src/payload'
import { Entity, MegalodonInterface } from 'megalodon'
import Thirdparty from 'src/components/settings/Thirdparty'
import { Settings } from 'src/entities/settings'
import SettingsPage from 'src/components/settings/Settings'
import Detail from 'src/components/detail/Detail'
import { useTranslation } from 'react-i18next'
import { Account } from 'src/entities/account'
import Report from 'src/components/report/Report'
import FromOtherAccount from 'src/components/fromOtherAccount/FromOtherAccount'

function App() {
  const { t, i18n } = useTranslation()

  const [servers, setServers] = useState<Array<ServerSet>>([])
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([])
  const [unreads, setUnreads] = useState<Array<Unread>>([])
  const [composeOpened, setComposeOpened] = useState<boolean>(false)
  const [style, setStyle] = useState<CSSProperties>({})

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState)

  const toaster = useToaster()

  const loadTimelines = async () => {
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    setTimelines(timelines)
  }

  useEffect(() => {
    loadAppearance()
    invoke<Array<[Server, Account | null]>>('list_servers').then(res => {
      if (res.length === 0) {
        console.debug('There is no server')
        dispatch({ target: 'newServer', value: true })
        toaster.push(alert('info', t('alert.no_server')), { placement: 'topCenter' })
      } else {
        console.debug('list_servers: ', res)
        setServers(
          res.map(r => ({
            server: r[0],
            account: r[1]
          }))
        )
      }
    })

    loadTimelines()

    listen('updated-timelines', () => {
      loadTimelines()
    })
    listen('updated-servers', async () => {
      const res = await invoke<Array<[Server, Account | null]>>('list_servers')
      setServers(
        res.map(r => ({
          server: r[0],
          account: r[1]
        }))
      )
    })

    listen<ReceiveNotificationPayload>('receive-notification', async ev => {
      const server_id = ev.payload.server_id
      const target = unreads.find(u => u.server_id === server_id)
      if (target) {
        setUnreads(
          unreads.map(u => {
            if (u.server_id === server_id) {
              return Object.assign({}, u, { count: u.count + 1 })
            }
            return u
          })
        )
      } else {
        setUnreads(unreads.concat({ server_id: server_id, count: 1 }))
      }

      let permissionGranted = await isPermissionGranted()
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }
      if (permissionGranted) {
        const [title, body] = generateNotification(ev.payload.notification, t)
        if (title.length > 0) {
          sendNotification({ title, body })
        }
      }
    })
  }, [])

  const loadAppearance = () => {
    invoke<Settings>('read_settings').then(res => {
      setStyle({
        fontSize: res.appearance.font_size
      })
      i18n.changeLanguage(res.appearance.language)
      dayjs.locale(res.appearance.language)
    })
  }

  const toggleCompose = () => {
    if (servers.find(s => s.account !== null)) {
      setComposeOpened(previous => !previous)
    } else {
      toaster.push(alert('info', t('alert.need_auth')), { placement: 'topStart' })
    }
  }

  return (
    <div
      className="container index"
      style={Object.assign({ backgroundColor: 'var(--rs-gray-900)', width: '100%', overflow: 'hidden' }, style)}
    >
      {/** Modals **/}
      <NewServer
        open={modalState.newServer.opened}
        onClose={() => dispatch({ target: 'newServer', value: false, object: null })}
        initialServer={modalState.newServer.object}
      />
      <Media
        index={modalState.media.index}
        media={modalState.media.object}
        opened={modalState.media.opened}
        close={() => dispatch({ target: 'media', value: false, object: [], index: 0 })}
      />
      <Thirdparty open={modalState.thirdparty.opened} onClose={() => dispatch({ target: 'thirdparty', value: false })} />
      <SettingsPage
        open={modalState.settings.opened}
        onClose={() => dispatch({ target: 'settings', value: false })}
        reloadAppearance={loadAppearance}
      />
      <Report
        opened={modalState.report.opened}
        status={modalState.report.object}
        client={modalState.report.client}
        close={() => dispatch({ target: 'report', value: false, object: null, client: null })}
      />
      <FromOtherAccount
        opened={modalState.fromOtherAccount.opened}
        status={modalState.fromOtherAccount.object}
        close={() => dispatch({ target: 'fromOtherAccount', value: false, object: null })}
      />

      <Container style={{ height: '100%' }}>
        <Navigator
          servers={servers}
          unreads={unreads}
          addNewServer={() => dispatch({ target: 'newServer', value: true, object: null })}
          openAuthorize={(server: Server) => dispatch({ target: 'newServer', value: true, object: server })}
          openThirdparty={() => dispatch({ target: 'thirdparty', value: true })}
          openSettings={() => dispatch({ target: 'settings', value: true })}
          toggleCompose={toggleCompose}
        />
        <Animation.Transition
          in={composeOpened}
          exitedClassName="compose-exited"
          exitingClassName="compose-exiting"
          enteredClassName="compose-entered"
          enteringClassName="compose-entering"
        >
          {(props, ref) => (
            <div {...props} ref={ref} style={{ overflow: 'hidden' }}>
              <Compose setOpened={setComposeOpened} servers={servers} />
            </div>
          )}
        </Animation.Transition>
        <Content style={{ display: 'flex', overflowX: 'auto' }}>
          {timelines.map(timeline => (
            <ShowTimeline
              timeline={timeline[0]}
              server={timeline[1]}
              unreads={unreads}
              setUnreads={setUnreads}
              key={timeline[0].id}
              openMedia={(media: Array<Entity.Attachment>, index: number) =>
                dispatch({ target: 'media', value: true, object: media, index: index })
              }
              openReport={(status: Entity.Status, client: MegalodonInterface) =>
                dispatch({ target: 'report', value: true, object: status, client: client })
              }
              openFromOtherAccount={(status: Entity.Status) => dispatch({ target: 'fromOtherAccount', value: true, object: status })}
            />
          ))}
          <NewTimeline servers={servers} />
        </Content>
        <Detail
          dispatch={dispatch}
          openMedia={(media: Array<Entity.Attachment>, index: number) =>
            dispatch({ target: 'media', value: true, object: media, index: index })
          }
          openReport={(status: Entity.Status, client: MegalodonInterface) =>
            dispatch({ target: 'report', value: true, object: status, client: client })
          }
          openFromOtherAccount={(status: Entity.Status) => dispatch({ target: 'fromOtherAccount', value: true, object: status })}
        />
      </Container>
    </div>
  )
}

type ModalState = {
  newServer: {
    opened: boolean
    object: Server | null
  }
  media: {
    opened: boolean
    object: Array<Entity.Attachment>
    index: number
  }
  thirdparty: {
    opened: boolean
  }
  settings: {
    opened: boolean
  }
  report: {
    opened: boolean
    object: Entity.Status | null
    client: MegalodonInterface | null
  }
  fromOtherAccount: {
    opened: boolean
    object: Entity.Status | null
  }
}

const initialModalState: ModalState = {
  newServer: {
    opened: false,
    object: null
  },
  media: {
    opened: false,
    object: [],
    index: 0
  },
  thirdparty: {
    opened: false
  },
  settings: {
    opened: false
  },
  report: {
    opened: false,
    object: null,
    client: null
  },
  fromOtherAccount: {
    opened: false,
    object: null
  }
}

const modalReducer = (
  current: ModalState,
  action: { target: string; value: boolean; object?: any; index?: number; client?: MegalodonInterface | null }
) => {
  switch (action.target) {
    case 'newServer':
      return { ...current, newServer: { opened: action.value, object: action.object } }
    case 'media':
      return { ...current, media: { opened: action.value, object: action.object, index: action.index } }
    case 'thirdparty':
      return { ...current, thirdparty: { opened: action.value } }
    case 'settings':
      return { ...current, settings: { opened: action.value } }
    case 'report':
      return { ...current, report: { opened: action.value, object: action.object, client: action.client } }
    case 'fromOtherAccount':
      return { ...current, fromOtherAccount: { opened: action.value, object: action.object } }
    default:
      return current
  }
}

export default App
