import { Entity, MegalodonInterface } from 'megalodon'
import { useState } from 'react'
import { TFunction } from 'i18next'
import { Loader, Modal, Placeholder, useToaster } from 'rsuite'
import Category from './Category'
import Rules from './Rules'
import Statuses from './Statuses'
import Comment from './Comment'
import alert from 'src/components/utils/alert'

type Props = {
  opened: boolean
  status: Entity.Status
  client: MegalodonInterface
  close: () => void
  t: TFunction<'translation', undefined, 'translation'>
}

export default function Report(props: Props) {
  const { t } = props
  const [category, setCategory] = useState<Entity.Category | null>(null)
  const [rules, setRules] = useState<Array<string> | null>(null)
  const [statuses, setStatuses] = useState<Array<string> | null>(null)
  const [comment, setComment] = useState<string | null>(null)
  const [_forward, setForward] = useState(true)
  const [sending, setSending] = useState(false)

  const toaster = useToaster()

  const reset = () => {
    setRules(null)
    setCategory(null)
    setStatuses(null)
    setComment(null)
    setForward(true)
    setSending(false)
  }

  const submit = async (
    category: Entity.Category,
    rules: Array<string> | null,
    statuses: Array<string>,
    comment: string,
    forward: boolean
  ) => {
    setSending(true)
    try {
      let options = {
        category: category,
        status_ids: statuses,
        comment: comment,
        forward: forward
      }
      if (rules !== null) {
        options = Object.assign({}, options, {
          rule_ids: rules.map(r => parseInt(r))
        })
      }
      await props.client.report(props.status.account.id, options)
    } catch (err) {
      console.error(err)
      toaster.push(alert('error', t('alert.failed_to_report')), { placement: 'topCenter' })
    } finally {
      setSending(false)
      reset()
      props.close()
    }
  }

  const body = () => {
    if (category === null) {
      return <Category next={(category: Entity.Category) => setCategory(category)} t={t} />
    } else if (rules === null && category === 'violation') {
      return <Rules client={props.client} next={(rules: Array<string>) => setRules(rules)} t={t} />
    } else if (statuses === null) {
      return (
        <Statuses account={props.status.account} client={props.client} next={(statuses: Array<string>) => setStatuses(statuses)} t={t} />
      )
    } else if (comment === null) {
      return (
        <Comment
          next={(comment: string, forward: boolean) => {
            setForward(forward)
            setComment(comment)
            submit(category, rules, statuses, comment, forward)
          }}
          t={t}
        />
      )
    } else if (sending) {
      return (
        <>
          <Placeholder.Paragraph rows={3} />
          <Loader center />
        </>
      )
    }
  }

  if (props.status) {
    return (
      <Modal
        size="sm"
        open={props.opened}
        onClose={() => {
          reset()
          props.close()
        }}
      >
        <Modal.Header>{t('report.title', { user: '@' + props.status.account.acct })}</Modal.Header>
        {body()}
      </Modal>
    )
  } else {
    return <></>
  }
}
