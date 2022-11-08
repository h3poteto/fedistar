import { Popover, Dropdown, ButtonToolbar, Whisper, IconButton, List, FlexboxGrid } from "rsuite"
import { Icon } from "@rsuite/icons";
import { AiOutlinePlus, AiOutlineHome, AiOutlineBell } from "react-icons/ai";
import { Server } from "../../entities/server";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

type Props = {
  servers: Array<Server>
}

const New: React.FC<Props> = (props) => {
  const [server, setServer] = useState<Server>();

  const addTimelineMenu = ({ onClose, left, top, className }, ref: any) => {
    const handleSelect = (eventKey: string) => {
      onClose();
      const target = props.servers.find((s) => s.id === parseInt(eventKey))
      setServer(target)
    };
    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          {props.servers.map((server) =>
            <Dropdown.Item eventKey={server.id} key={server.id}>{server.domain}</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Popover>
    );
  };

  const addButton = () => (
    <div className="add-timeline" style={{ width: "240px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#242424" }}>
      <ButtonToolbar>
        <Whisper placement="bottomStart" trigger="click" speaker={addTimelineMenu}>
          <IconButton icon={<Icon as={AiOutlinePlus} />} size="lg" appearance="ghost" />
        </Whisper>
      </ButtonToolbar>
    </div>
  )

  const select = async (tl: string) => {
    await invoke("add_timeline", { server: server, timeline: tl })
    setServer(undefined)
  }

  const selectTimeline = () => (
    <div className="add-timeline" style={{ width: "240px", display: "flex", flexDirection: "column", backgroundColor: "#242424" }}>
      <List hover>
        <List.Item index={1} onClick={() => select("home")}>
          <FlexboxGrid align="middle">
            <FlexboxGrid.Item colspan={4} style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Icon as={AiOutlineHome} />
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={20}>
              <div>Home</div>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </List.Item>
        <List.Item index={2} onClick={() => select("notifications")}>
          <FlexboxGrid align="middle">
            <FlexboxGrid.Item colspan={4} style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
              <Icon as={AiOutlineBell} />
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={20}>
              <div>Notifications</div>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </List.Item>
      </List>
    </div>
  )

  if (server === undefined) {
    return addButton()
  } else {
    return selectTimeline()
  }
}

export default New;
