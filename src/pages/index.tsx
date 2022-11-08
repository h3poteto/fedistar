import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event'
import { useRouter } from "next/router";
import Image from "next/image";
import { Container, Content, Message, useToaster, Sidebar, Sidenav} from "rsuite"
import { Server } from "../entities/server";
import { Timeline } from "../entities/timeline";
import NewTimeline from "src/components/timeline/New"
import ShowTimeline from "src/components/timeline/Show"

function App() {
  const [servers, setServers] = useState<Array<Server>>([]);
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([]);
  const router = useRouter();
  const toaster = useToaster();

  const loadTimelines = async () => {
    const timelines = await invoke<Array<[Timeline, Server]>>("list_timelines")
    setTimelines(timelines)
  }

  const message = (
    <Message showIcon type="info">
      There is no server, so please add it at first.
    </Message>
  )

  useEffect(() => {
    invoke<Array<Server>>("list_servers").then(res => {
      if (res.length === 0) {
        console.debug("There is no server");
        toaster.push(message, { placement: "topCenter" });
        router.push("/server/new");
      } else {
        setServers(res)
      }
    })

    loadTimelines()

    listen("updated-timelines", (event) => {
      console.log(event)
    })
  }, [])



  return (
    <div className="container index">
      <Container style={{ height: "100%" }}>
        <Sidebar style={{ display: 'flex', flexDirection: 'column' }} width="56" collapsible>
          <Sidenav expanded={false}>
            <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {servers.map((server) =>
                <div style={{ padding: '8px' }} key={server.id}>
                  <Image width={48} height={48} src={server.base_url + "/favicon.ico"} className="server-icon" alt={server.domain} key={server.id} />
                </div>
              )}
            </Sidenav.Body>
          </Sidenav>
        </Sidebar>
        <Content style={{ display: 'flex'}}>
          {timelines.map((timeline) =>
            <ShowTimeline timeline={timeline[0]} server={timeline[1]} key={timeline[0].id} />
          )}
          <NewTimeline servers={servers} />
        </Content>
      </Container>
    </div>
  );
}

export default App;
