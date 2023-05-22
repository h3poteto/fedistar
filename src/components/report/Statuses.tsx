import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { Avatar, Button, Checkbox, CheckboxGroup, FlexboxGrid, Loader, Modal, Placeholder } from 'rsuite'
import emojify from 'src/utils/emojify'
import Time from 'src/components/utils/Time'

type Props = {
  account: Entity.Account
  client: MegalodonInterface
  next: (ids: Array<string>) => void
}

export default function Statuses(props: Props) {
  const { t } = useTranslation('common')
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [values, setValues] = useState<Array<string>>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      try {
        const res = await props.client.getAccountStatuses(props.account.id, { exclude_reblogs: true })
        setStatuses(res.data)
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [props.account, props.client])

  return (
    <>
      <Modal.Body>
        <Modal.Title>{t('report.statuses.title')}</Modal.Title>
        <p>{t('report.statuses.description')}</p>
        <div style={{ paddingTop: '2em' }}>
          {loading ? (
            <>
              <Placeholder.Paragraph rows={3} />
              <Loader center />
            </>
          ) : (
            statuses.length === 0 && <p>{t('report.statuses.no_status')}</p>
          )}
          <CheckboxGroup name="statuses" value={values} onChange={value => setValues(value.map(v => v.toString()))}>
            {statuses.map(s => (
              <Checkbox className="report-statuses" key={s.id} value={s.id}>
                <Status status={s} />
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next(values)}>
          {t('report.statuses.next')}
        </Button>
      </Modal.Footer>
    </>
  )
}

type StatusProps = {
  status: Entity.Status
}

const Status: React.FC<StatusProps> = props => {
  const { status } = props

  return (
    <>
      {/** account **/}
      <FlexboxGrid align="middle">
        {/** icon **/}
        <FlexboxGrid.Item colspan={3}>
          <div style={{ margin: '6px' }}>
            <Avatar src={status.account.avatar} title={status.account.acct} alt={status.account.acct} />
          </div>
        </FlexboxGrid.Item>
        {/** account name **/}
        <FlexboxGrid.Item colspan={19}>
          <div>
            <strong>
              <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--rs-text-tertiary)' }}>@{status.account.acct}</span>
          </div>
        </FlexboxGrid.Item>
        {/** timestamp **/}
        <FlexboxGrid.Item colspan={2}>
          <Time time={status.created_at} />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      <div className="body" style={{ marginTop: '4px' }}>
        {status.spoiler_text.length > 0 && (
          <div
            className="spoiler-text"
            style={{ wordWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: emojify(status.spoiler_text, status.emojis) }}
          />
        )}
        <div
          className="status-body"
          style={{ wordWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: emojify(status.content, status.emojis) }}
        />
      </div>
    </>
  )
}
