import { FormattedMessage } from 'react-intl'
import { List, Modal } from 'rsuite'
import licenses from 'src/thirdparty.json'

type Props = {
  open: boolean
  onClose: () => void
}

const Thirdparty: React.FC<Props> = props => {
  return (
    <Modal backdrop="static" keyboard={true} open={props.open} onClose={props.onClose}>
      <Modal.Header>
        <Modal.Title>
          <FormattedMessage id="settings.thirdparty.title" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <List style={{ margin: '0 8px', backgroundColor: 'var(--rs-border-secondary)' }}>
          {licenses.map((l, index) => (
            <List.Item
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--rs-border-secondary)',
                boxShadow: '0 -1px 0 var(--rs-border-primary),0 1px 0 var(--rs-border-primary)'
              }}
              key={index}
            >
              <div style={{ paddingRight: '12px' }}>{l.package_name}</div>
              <div style={{ paddingRight: '0' }}>{l.license}</div>
            </List.Item>
          ))}
        </List>
      </Modal.Body>
    </Modal>
  )
}

export default Thirdparty
