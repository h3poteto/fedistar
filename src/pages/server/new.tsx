import { useState } from "react";
import { useRouter } from "next/router";
import { Container, Content, FlexboxGrid, Panel, Form, ButtonToolbar, Button, Loader, Input, Message, useToaster } from "rsuite"
import { invoke } from "@tauri-apps/api/tauri";
import { Server } from "../../entities/server";
import { OAuth } from "megalodon";

function New() {
  const [server, setServer] = useState<Server>();
  const [app, setApp] = useState<OAuth.AppDataFromServer>();
  const [loading, setLoading] = useState<boolean>(false);
  const [domain, setDomain] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();
  const toaster = useToaster();

  const successMessage = (server: Server) => (
    <Message showIcon type="success">
      {server.domain} is registered.
    </Message>
  )

  async function addServer() {
    setLoading(true)
    setServer(await invoke<Server>("add_server", { domain }))
    setLoading(false)
  }

  async function addApplication() {
    setLoading(true)
    setApp(await invoke<OAuth.AppDataFromServer>("add_application", { url: server.base_url }))
    setLoading(false)
  }

  async function authorizeCode() {
    setLoading(true)
    await invoke("authorize_code", { server: server, app: app, code: code })
    setLoading(false)
    toaster.push(successMessage(server), { placement: "topCenter" });
    router.push("/");
  }

  return (
    <div className="container login-page">
      <Container>
        <Content>
          <FlexboxGrid justify="center" align="middle">
            <FlexboxGrid.Item colspan={12}>
              <Panel header={<h3>Add Server</h3>} bordered>
                {server === undefined && (
                  <Form fluid onChange={(o) => setDomain(o.domain)}>
                    <Form.Group>
                      <Form.ControlLabel>Domain</Form.ControlLabel>
                      <Form.Control name="domain"/>
                    </Form.Group>
                    <Form.Group>
                      <ButtonToolbar>
                        <Button appearance="primary" onClick={() => addServer()}>Add</Button>
                        <Button appearance="link">Cancel</Button>
                      </ButtonToolbar>
                    </Form.Group>
                  </Form>
                )}
                {server !== undefined && app === undefined && (
                  <Form fluid>
                    <Form.Group>
                      <Input value={domain} disabled />
                    </Form.Group>
                    <Form.Group>
                    <ButtonToolbar>
                      <Button appearance="primary" onClick={() => addApplication()}>Sign In</Button>
                      <Button appearance="link">Cancel</Button>
                    </ButtonToolbar>
                    </Form.Group>
                  </Form>
                )}
                {app !== undefined && (
                  <Form fluid onChange={(o) => setCode(o.code)}>
                    <Form.Group>
                      <Form.ControlLabel>Authorization Code</Form.ControlLabel>
                      <Form.Control name="code"/>
                      <Form.HelpText>Please paste the authorization code from your browser</Form.HelpText>
                    </Form.Group>
                    <Form.Group>
                      <ButtonToolbar>
                        <Button appearance="primary" onClick={() => authorizeCode()}>Authorize</Button>
                        <Button appearance="link">Cancel</Button>
                      </ButtonToolbar>
                    </Form.Group>
                  </Form>
                )}
                {loading && <Loader center backdrop content="loading" />}
              </Panel>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Content>
      </Container>
    </div>
  )
}

export default New;
