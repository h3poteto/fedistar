import { Icon } from '@rsuite/icons'
import { Entity } from 'megalodon'
import { Avatar, Button, HStack } from 'rsuite'
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
    <HStack>
      {/** icon **/}
      <div style={{ margin: '6px' }}>
        <Avatar src={user.avatar} />
      </div>
      {/** name **/}
      <HStack.Item grow={1} style={{ overflow: 'hidden' }}>
        <div>
          <span dangerouslySetInnerHTML={{ __html: emojify(user.display_name, user.emojis) }} />
        </div>
        <div>
          <span style={{ color: 'var(--rs-text-tertiary)' }}>@{user.acct}</span>
        </div>
      </HStack.Item>
      {/** follow/unfollow **/}
      {relationship ? (
        relationship.following ? (
          <Button appearance="link" size="lg" onClick={() => props.unfollow(user)}>
            <Icon as={BsPersonX} style={{ fontSize: '1.2em' }} />
          </Button>
        ) : (
          <Button appearance="link" size="lg" onClick={() => props.follow(user)}>
            <Icon as={BsPersonPlus} style={{ fontSize: '1.2em', color: 'var(--rs-text-tertiary)' }} />
          </Button>
        )
      ) : null}
    </HStack>
  )
}

export default User
