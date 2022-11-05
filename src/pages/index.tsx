import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useRouter } from "next/router";
import Image from "next/image";
import { Container, Content, Message, useToaster, Placeholder, Sidebar, Sidenav, Nav } from "rsuite"
import { Icon } from "@rsuite/icons";
import { AiOutlineEdit } from "react-icons/ai";
import { Server } from "../entities/server";

function App() {
  const [servers, setServers] = useState<Array<Server>>([]);
  const router = useRouter();
  const toaster = useToaster();

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
      }
      setServers(res)
    })
  }, [])

  return (
    <div className="container index">
      <Container>
        <Sidebar style={{ display: 'flex', flexDirection: 'column' }} width="56" collapsible>
          <Sidenav expanded={false}>
            <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {servers.map((server) =>
                <div style={{ padding: '8px' }}>
                  <Image width={48} height={48} src={server.base_url + "/favicon.ico"} className="server-icon" alt={server.domain} key={server.id} />
                </div>
              )}
            </Sidenav.Body>
          </Sidenav>
        </Sidebar>
        <Content>
          <Placeholder.Grid rows={5} columns={6} active />
        </Content>
      </Container>
    </div>
  );
}

export default App;
