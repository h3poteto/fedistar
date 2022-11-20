import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Container, Content, Message, useToaster } from 'rsuite'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import NewTimeline from 'src/components/timelines/New'
import ShowTimeline from 'src/components/timelines/Show'
import NewServer from 'src/components/servers/New'
import Navigator from 'src/components/Navigator'

function App() {
  const [servers, setServers] = useState<Array<Server>>([])
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([])
  const [newServer, setNewServer] = useState<boolean>(false)
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
        setNewServer(true)
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
  }, [])

  return (
    <div className="container index">
      <NewServer open={newServer} onClose={() => setNewServer(false)} />
      <Container style={{ height: '100%' }}>
        <Navigator servers={servers} setNewServer={setNewServer} />
        <Content style={{ display: 'flex' }}>
          {timelines.map(timeline => (
            <ShowTimeline timeline={timeline[0]} server={timeline[1]} key={timeline[0].id} />
          ))}
          <NewTimeline servers={servers} />
        </Content>
      </Container>
    </div>
  )
}

export default App
