import { useState, useEffect, useReducer } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Container, Content, Message, useToaster, Animation } from 'rsuite'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'

import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import { Unread } from 'src/entities/unread'

import NewTimeline from 'src/components/timelines/New'
import ShowTimeline from 'src/components/timelines/Show'
import NewServer from 'src/components/servers/New'
import Navigator from 'src/components/Navigator'
import Compose from 'src/components/Compose'
import Media from 'src/components/Media'
import generateNotification from 'src/utils/notification'
import { ReceiveNotificationPayload } from 'src/payload'

function App() {
  const [servers, setServers] = useState<Array<Server>>([])
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([])
  const [initialServer, setInitialServer] = useState<Server | null>(null)
  const [unreads, setUnreads] = useState<Array<Unread>>([])
  const [composeOpened, setComposeOpened] = useState<boolean>(false)
  const [modalState, dispatch] = useReducer(modalReducer, initialModalState)

  const toaster = useToaster()

  const loadTimelines = async () => {
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    setTimelines(timelines)
  }

  const message = (
    <Message showIcon type="info">
      There is no server, so please add it at first.
    </Message>
  )

  useEffect(() => {
    invoke<Array<Server>>('list_servers').then(res => {
      if (res.length === 0) {
        console.debug('There is no server')
        dispatch({ target: 'newServer', value: true })
        toaster.push(message, { placement: 'topCenter' })
      } else {
        setServers(res)
      }
    })

    loadTimelines()

    listen('updated-timelines', () => {
      loadTimelines()
    })
    listen('updated-servers', async () => {
      const res = await invoke<Array<Server>>('list_servers')
      setServers(res)
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
        const [title, body] = generateNotification(ev.payload.notification)
        if (title.length > 0) {
          sendNotification({ title, body })
        }
      }
    })
  }, [])

  const openCompose = () => {
    setComposeOpened(true)
  }

  return (
    <div className="container index">
      <NewServer
        open={modalState.newServer}
        onClose={() => dispatch({ target: 'newServer', value: false })}
        initialServer={initialServer}
      />
      <Media media={modalState.media.object} opened={modalState.media.opened} close={() => dispatch({ target: 'media', value: false })} />
      <Container style={{ height: '100%' }}>
        <Navigator
          servers={servers}
          unreads={unreads}
          setNewServer={(value: boolean) => dispatch({ target: 'newServer', value: value })}
          setInitialServer={setInitialServer}
          openCompose={openCompose}
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
        <Content style={{ display: 'flex' }}>
          {timelines.map(timeline => (
            <ShowTimeline
              timeline={timeline[0]}
              server={timeline[1]}
              unreads={unreads}
              setUnreads={setUnreads}
              key={timeline[0].id}
              openMedia={(media: Entity.Attachment) => dispatch({ target: 'media', value: true, object: media })}
            />
          ))}
          <NewTimeline servers={servers} />
        </Content>
      </Container>
    </div>
  )
}

type ModalState = {
  newServer: boolean
  media: {
    opened: boolean
    object: Entity.Attachment
  }
}

const initialModalState: ModalState = {
  newServer: false,
  media: {
    opened: false,
    object: undefined
  }
}

const modalReducer = (current: ModalState, action: { target: string; value: boolean; object?: any }) => {
  switch (action.target) {
    case 'newServer':
      return { ...current, newServer: action.value }
    case 'media':
      return { ...current, media: { opened: action.value, object: action.object } }
    default:
      return current
  }
}

export default App
