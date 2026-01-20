import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid, Panel } from 'rsuite'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import FailoverImg from 'src/utils/failoverImg'
import Body from './Body'
import { Server } from 'src/entities/server'
import { FormattedMessage } from 'react-intl'

type Props = {
  quote: Entity.QuotedStatus
  server: Server
  setStatusDetail?: (statusId: string, serverId: number, accountId?: number) => void
  setAccountDetail: (userId: string, serverId: number, accountId?: number) => void
}

const Quote: React.FC<Props> = props => {
  const statusClicked = async (status: Entity.Status, server: Server) => {
    if (props.setStatusDetail) {
      props.setStatusDetail(status.id, server.id)
    }
  }

  if (isQuote(props.quote) && props.quote.quoted_status) {
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
              style={{ cursor: 'pointer' }}
              onClick={() => props.setAccountDetail(quote.quoted_status.account.id, props.server.id)}
            />
          </div>
          <div style={{ width: `calc(100% - 38px)` }}>
            <FlexboxGrid justify="space-between">
              <FlexboxGrid.Item
                colspan={18}
                onClick={() => props.setAccountDetail(quote.quoted_status.account.id, props.server.id)}
                style={{ cursor: 'pointer' }}
              >
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
                <Time time={quote.quoted_status.created_at} onClick={() => statusClicked(quote.quoted_status, props.server)} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
        </div>
        <div style={{ padding: '0 4px 4px 4px' }}>
          <Body
            status={quote.quoted_status}
            onClick={() => statusClicked(quote.quoted_status, props.server)}
            spoilered={false}
            setSpoilered={() => {}}
            style={{ cursor: 'pointer' }}
          />
          {quote.quoted_status.quote && (
            <div
              style={{
                backgroundColor: 'var(--rs-bg-overlay)',
                color: 'var(--rs-text-secondary)',
                border: '1px solid var(--rs-border-primary)',
                padding: '4px 8px',
                marginTop: '4px',
                borderRadius: '4px'
              }}
            >
              <FormattedMessage id="timeline.quote.shallow_quote" />
            </div>
          )}
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
