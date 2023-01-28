import { Icon } from '@rsuite/icons'
import { Entity } from 'megalodon'
import { Avatar, Button, FlexboxGrid } from 'rsuite'
import { BsPersonPlus, BsPersonX } from 'react-icons/bs'
import emojify from 'src/utils/emojify'

type Props = {
  user: Entity.Account
  relationship: Entity.Relationship | null
  follow: (user: Entity.Account) => void
  unfollow: (user: Entity.Account) => void
}

const User: React.FC<Props> = props => {
  const { user, relationship } = props
  return (
    <FlexboxGrid align="middle">
      {/** icon **/}
      <FlexboxGrid.Item colspan={4}>
        <div style={{ margin: '6px' }}>
          <Avatar src={user.avatar} />
        </div>
      </FlexboxGrid.Item>
      {/** name **/}
      <FlexboxGrid.Item colspan={16}>
        <div>
          <span dangerouslySetInnerHTML={{ __html: emojify(user.display_name, user.emojis) }} />
        </div>
        <div>
          <span style={{ color: 'var(--rs-text-tertiary)' }}>@{user.acct}</span>
        </div>
      </FlexboxGrid.Item>
      {/** follow/unfollow **/}
      <FlexboxGrid.Item colspan={4}>
        {relationship && relationship.following ? (
          <Button appearance="link" size="lg" onClick={() => props.unfollow(user)}>
            <Icon as={BsPersonX} style={{ fontSize: '1.2em' }} />
          </Button>
        ) : (
          <Button appearance="link" size="lg" onClick={() => props.follow(user)}>
            <Icon as={BsPersonPlus} style={{ fontSize: '1.2em', color: 'var(--rs-text-tertiary)' }} />
          </Button>
        )}
      </FlexboxGrid.Item>
    </FlexboxGrid>
  )
}

export default User
