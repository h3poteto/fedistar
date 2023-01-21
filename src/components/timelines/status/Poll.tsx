import { Entity, MegalodonInterface } from 'megalodon'
import { useState } from 'react'
import { Button, Checkbox, CheckboxGroup, Progress, Radio, RadioGroup } from 'rsuite'
import Time from 'src/components/utils/Time'

type Props = {
  poll: Entity.Poll
  client: MegalodonInterface
  pollUpdated: () => void
}

const Poll: React.FC<Props> = props => {
  if (props.poll.voted || props.poll.expired) {
    return <PollResult poll={props.poll} client={props.client} pollUpdated={props.pollUpdated} />
  } else {
    if (props.poll.multiple) {
      return <MultiplePoll poll={props.poll} client={props.client} pollUpdated={props.pollUpdated} />
    } else {
      return <SimplePoll poll={props.poll} client={props.client} pollUpdated={props.pollUpdated} />
    }
  }
}

const SimplePoll: React.FC<Props> = props => {
  const [pollRadio, setPollRadio] = useState<number | null>(null)

  const post = async () => {
    if (pollRadio !== null) {
      await props.client.votePoll(props.poll.id, [pollRadio])
      props.pollUpdated()
    }
  }

  return (
    <>
      <RadioGroup value={pollRadio} onChange={value => setPollRadio(parseInt(value.toString()))}>
        {props.poll.options.map((option, index) => (
          <div key={index}>
            <Radio value={index}>{option.title}</Radio>
          </div>
        ))}
      </RadioGroup>
      <Button appearance="ghost" size="sm" style={{ marginLeft: '10px' }} onClick={post}>
        Vote
      </Button>
      <span style={{ paddingLeft: '8px' }}>{props.poll.votes_count} people</span>
      <Time time={props.poll.expires_at} style={{ paddingLeft: '8px' }} /> left
    </>
  )
}

const MultiplePoll: React.FC<Props> = props => {
  const [pollCheck, setPollCheck] = useState<Array<number>>([])

  const post = async () => {
    if (pollCheck.length > 0) {
      await props.client.votePoll(props.poll.id, pollCheck)
      props.pollUpdated()
    }
  }

  return (
    <>
      <CheckboxGroup value={pollCheck} onChange={value => setPollCheck(value.map(v => parseInt(v.toString())))}>
        {props.poll.options.map((option, index) => (
          <div key={index}>
            <Checkbox value={index}>{option.title}</Checkbox>
          </div>
        ))}
      </CheckboxGroup>
      <Button appearance="ghost" size="sm" style={{ marginLeft: '10px' }} onClick={post}>
        Vote
      </Button>
      <span style={{ paddingLeft: '8px' }}>{props.poll.votes_count} people</span>
      <Time time={props.poll.expires_at} style={{ paddingLeft: '8px' }} /> left
    </>
  )
}

const PollResult: React.FC<Props> = props => {
  return (
    <>
      {props.poll.options.map((option, index) => (
        <div key={index}>
          <span style={{ paddingLeft: '12px' }}>{option.title}</span>
          <Progress.Line percent={percent(option.votes_count, props.poll.votes_count)} strokeWidth={5} />
        </div>
      ))}
      <Button appearance="subtle" size="sm" onClick={props.pollUpdated}>
        Refresh
      </Button>
      <span style={{ paddingLeft: '8px' }}>{props.poll.votes_count} people</span>
      {props.poll.expired ? (
        <span style={{ paddingLeft: '8px' }}>Closed</span>
      ) : (
        <>
          <Time time={props.poll.expires_at} style={{ paddingLeft: '8px' }} /> left
        </>
      )}
    </>
  )
}

const percent = (votes: number, all: number) => {
  if (all > 0) {
    return Math.round((votes * 100) / all)
  } else {
    return 0
  }
}

export default Poll
