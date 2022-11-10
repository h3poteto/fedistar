import { Entity } from 'megalodon'
import { FlexboxGrid, List, Avatar } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat } from 'react-icons/bs'
import moment from 'moment'

type Props = {
  status: Entity.Status
}

const parseDatetime = (timestamp: string) => {
  return moment(timestamp).fromNow(true)
}

const originalStatus = (status: Entity.Status) => {
  if (status.reblog && !status.quote) {
    return status.reblog
  } else {
    return status
  }
}

const rebloggedHeader = (status: Entity.Status) => {
  if (status.reblog && !status.quote) {
    return (
      <div>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
            <Icon as={BsArrowRepeat} style={{ color: 'green' }} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>{status.account.display_name}</FlexboxGrid.Item>
        </FlexboxGrid>
      </div>
    )
  } else {
    return null
  }
}

const Status: React.FC<Props> = props => {
  const status = originalStatus(props.status)

  return (
    <List.Item style={{ paddingTop: '2px', paddingBottom: '2px' }}>
      {rebloggedHeader(props.status)}
      <FlexboxGrid>
        {/** icon **/}
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar src={status.account.avatar} />
          </div>
        </FlexboxGrid.Item>
        {/** status **/}
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div className="metadata">
            <FlexboxGrid>
              {/** account name **/}
              <FlexboxGrid.Item colspan={18} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {status.account.display_name}@{status.account.acct}
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
                <time dateTime={moment(status.created_at).format('YYYY-MM-DD HH:mm:ss')} title={moment(status.created_at).format('LLLL')}>
                  {parseDatetime(status.created_at)}
                </time>
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <div className="body" style={{ wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: status.content }}></div>
          <div className="toolbox"></div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </List.Item>
  )
}

export default Status
