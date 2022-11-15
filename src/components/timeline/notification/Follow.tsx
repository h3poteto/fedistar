import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { BsPersonPlus } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import moment from 'moment'

type Props = {
  notification: Entity.Notification
}

const parseDatetime = (timestamp: string) => {
  return moment(timestamp).fromNow(true)
}

const Follow: React.FC<Props> = props => {
  return (
    <div>
      {/** action **/}
      <FlexboxGrid align="middle" style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          <Icon as={BsPersonPlus} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={14} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.notification.account.display_name} followed you
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
          <time
            dateTime={moment(props.notification.created_at).format('YYYY-MM-DD HH:mm:ss')}
            title={moment(props.notification.created_at).format('LLLL')}
          >
            {parseDatetime(props.notification.created_at)}
          </time>
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {/** body **/}
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar src={props.notification.account.avatar} />
          </div>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div>{props.notification.account.display_name}</div>
          <div>{props.notification.account.acct}</div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

export default Follow
