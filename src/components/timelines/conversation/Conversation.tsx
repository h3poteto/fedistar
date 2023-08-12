import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid, Button, Badge } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsPaperclip } from 'react-icons/bs'

import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import Body from '../status/Body'
import { useState } from 'react'

type Props = {
  conversation: Entity.Conversation
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  selectStatus: (conversationId: string, status: Entity.Status | null) => void
}
const Conversation: React.FC<Props> = props => {
  const { conversation } = props
  const account = conversation.accounts[0]
  const [spoilered, setSpoilered] = useState<boolean>(conversation.last_status && conversation.last_status.spoiler_text.length > 0)

  return (
    <div className="conversation">
      <div style={{ display: 'flex' }}>
        {/** icon **/}
        <div onClick={() => props.selectStatus(conversation.id, conversation.last_status)} style={{ cursor: 'pointer', width: '56px' }}>
          <div style={{ margin: '6px' }}>
            <Avatar src={account.avatar} circle title={account.acct} alt={account.acct} />
          </div>
        </div>
        {/** message **/}
        <div style={{ cursor: 'pointer', width: 'calc(100% - 56px)' }}>
          <div className="metadata" onClick={() => props.selectStatus(conversation.id, conversation.last_status)}>
            <FlexboxGrid>
              {/** account name **/}
              <FlexboxGrid.Item colspan={18} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--rs-text-tertiary)' }}>With </span>
                <span dangerouslySetInnerHTML={{ __html: emojify(account.display_name, account.emojis) }} />
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-tertiary)' }}>
                {conversation.unread && <Badge color="blue" style={{ marginRight: '4px' }} />}
                {conversation.last_status && <Time time={conversation.last_status.created_at} />}
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          {conversation.last_status && (
            <Body
              status={conversation.last_status}
              style={{ color: 'var(--rs-text-tertiary)' }}
              onClick={() => props.selectStatus(conversation.id, conversation.last_status)}
              spoilered={spoilered}
              setSpoilered={setSpoilered}
            />
          )}
          {conversation.last_status &&
            conversation.last_status.media_attachments.map((media, index) => (
              <div key={index}>
                <Button appearance="subtle" size="sm" onClick={() => props.openMedia(conversation.last_status.media_attachments, index)}>
                  <Icon as={BsPaperclip} />
                  {media.id}
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Conversation
