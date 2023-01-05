import { Entity } from 'megalodon'
import { BsX, BsThreeDotsVertical } from 'react-icons/bs'
import { Button, Container, Content, FlexboxGrid, Header, IconButton } from 'rsuite'
import { Icon } from '@rsuite/icons'
import Image from 'next/image'
import emojify from 'src/utils/emojify'

type Props = {
  account: Entity.Account
  onClose: () => void
}

const Profile: React.FC<Props> = props => {
  const { account } = props

  return (
    <Container className="profile" style={{ height: '100%', borderLeft: '1px solid var(--rs-gray-600)' }}>
      <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
        <Button appearance="link" onClick={props.onClose}>
          <Icon as={BsX} style={{ fontSize: '1.4em' }} />
        </Button>
      </Header>
      <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)' }}>
        <div className="profile-header-image" style={{ width: '100%', backgroundColor: 'var(--rs-body)' }}>
          <img src={account.header} alt="header image" style={{ objectFit: 'cover', width: '100%', height: '146px' }} />
        </div>
        <div className="profile-header-body" style={{ padding: '0 20px' }}>
          <FlexboxGrid justify="space-between" align="bottom" style={{ marginTop: '-50px' }}>
            <FlexboxGrid.Item>
              <Image src={account.avatar} alt={account.acct} width={94} height={94} style={{ borderRadius: '4px' }} />
            </FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <FlexboxGrid style={{ gap: '8px' }}>
                <FlexboxGrid.Item>
                  <Button appearance="primary">Follow</Button>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <IconButton icon={<Icon as={BsThreeDotsVertical} />} />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
          <div className="username" style={{ margin: '16px 0' }}>
            <span
              style={{ fontSize: '1.2em', fontWeight: 'bold', display: 'block' }}
              dangerouslySetInnerHTML={{ __html: emojify(account.display_name, account.emojis) }}
            ></span>
            <span style={{ display: 'block', color: 'var(--rs-text-secondary)' }}>@{account.acct}</span>
          </div>
          <div className="bio">
            <div dangerouslySetInnerHTML={{ __html: account.note }} />
          </div>
          <div className="fields" style={{ backgroundColor: 'var(--rs-body)', borderRadius: '4px', margin: '16px 0' }}>
            {account.fields.map((data, index) => (
              <dl key={index} style={{ padding: '8px 16px', margin: 0, borderBottom: '1px solid var(--rs-bg-card)' }}>
                <dt>{data.name}</dt>
                <dd dangerouslySetInnerHTML={{ __html: emojify(data.value, account.emojis) }} style={{ margin: 0 }} />
              </dl>
            ))}
          </div>
          <FlexboxGrid className="status" justify="space-between">
            <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{account.statuses_count} Posts</FlexboxGrid.Item>
            <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{account.following_count} Following</FlexboxGrid.Item>
            <FlexboxGrid.Item style={{ fontWeight: 'bold' }}>{account.followers_count} Followers</FlexboxGrid.Item>
          </FlexboxGrid>
        </div>
      </Content>
    </Container>
  )
}

export default Profile
