import { Entity } from 'megalodon'
import { MouseEventHandler } from 'react'
import { Avatar, FlexboxGrid, Panel } from 'rsuite'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import FailoverImg from 'src/utils/failoverImg'
import Body from './Body'

type Props = {
  quote: Entity.QuotedStatus
}

const Quote: React.FC<Props> = props => {
  const statusClicked: MouseEventHandler<HTMLDivElement> = async e => {}

  if (isQuote(props.quote)) {
    const quote = props.quote as Entity.Quote
    return (
      <Panel bordered bodyFill className="quote" style={{ position: 'relative', marginTop: '4px' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '30px', padding: '6px 4px 0px 4px' }}>
            <Avatar
              size="sm"
              src={FailoverImg(quote.quoted_status.account.avatar_static)}
              title={quote.quoted_status.account.acct}
              alt={quote.quoted_status.account.acct}
            />
          </div>
          <div style={{ width: `calc(100% - 38px)` }}>
            <FlexboxGrid justify="space-between">
              <FlexboxGrid.Item colspan={18}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: emojify(quote.quoted_status.account.display_name, quote.quoted_status.account.emojis)
                    }}
                  />
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--rs-text-tertiary)' }}>@{quote.quoted_status.account.acct}</span>
                </div>
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-tertiary)', paddingRight: '4px' }}>
                <Time time={quote.quoted_status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
        </div>
        <div style={{ padding: '0 4px 4px 4px' }}>
          <Body status={quote.quoted_status} onClick={statusClicked} spoilered={false} setSpoilered={() => {}} />
        </div>
      </Panel>
    )
  } else {
    return null
  }
}

export default Quote

function isQuote(quote: Entity.QuotedStatus): quote is Entity.Quote {
  return 'quoted_status' in quote
}
