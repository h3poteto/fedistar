import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsStar } from 'react-icons/bs'
import Time from 'src/components/utils/Time'

type Props = {
  notification: Entity.Notification
}

const Favourite: React.FC<Props> = props => {
  const status = props.notification.status

  return (
    <div>
      {/** action **/}
      <FlexboxGrid style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          <Icon as={BsStar} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={14} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.notification.account.display_name} favourited your post
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
          <Time time={props.notification.created_at} />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {/** body **/}
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
                <Time time={status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <div className="body" style={{ wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: status.content }}></div>
          <div className="toolbox"></div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

export default Favourite
