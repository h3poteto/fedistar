import { Entity } from 'megalodon'
import { Button, Checkbox, Progress, Radio } from 'rsuite'
import Time from 'src/components/utils/Time'

type Props = {
  poll: Entity.Poll
}

const Poll: React.FC<Props> = props => {
  if (props.poll.voted || props.poll.expired) {
    return <PollResult poll={props.poll} />
  } else {
    if (props.poll.multiple) {
      return <MultiplePoll poll={props.poll} />
    } else {
      return <SimplePoll poll={props.poll} />
    }
  }
}

const SimplePoll: React.FC<Props> = props => {
  return (
    <>
      {props.poll.options.map((option, index) => (
        <div key={index}>
          <Radio>{option.title}</Radio>
        </div>
      ))}
      <Button appearance="ghost" size="sm" style={{ marginLeft: '10px' }}>
        Vote
      </Button>
      <span style={{ paddingLeft: '8px' }}>{props.poll.votes_count} people</span>
      <Time time={props.poll.expires_at} style={{ paddingLeft: '8px' }} /> left
    </>
  )
}

const MultiplePoll: React.FC<Props> = props => {
  return (
    <>
      {props.poll.options.map((option, index) => (
        <div key={index}>
          <Checkbox>{option.title}</Checkbox>
        </div>
      ))}
      <Button appearance="ghost" size="sm" style={{ marginLeft: '10px' }}>
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
      <Button appearance="subtle">Refresh</Button>
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
