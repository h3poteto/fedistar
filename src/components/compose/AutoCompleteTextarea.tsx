import { useEffect, useRef, useState, forwardRef } from 'react'
import { Input, Popover, Whisper } from 'rsuite'
import { PrependParameters } from 'rsuite/esm/@types/utils'
import { init, SearchIndex } from 'emoji-mart'
import { data } from 'src/utils/emojiData'

export type ArgProps = {
  onChange: (value: string) => void
}

type SuggestItem = {
  name: string
  code?: string
  icon?: string
}

const AutoCompleteTextarea: React.ForwardRefRenderFunction<HTMLTextAreaElement, ArgProps> = (props, ref) => {
  const [suggestList, setSuggestList] = useState<Array<SuggestItem>>([])
  const [currentValue, setCurrentValue] = useState<string>('')
  const [startIndex, setStartIndex] = useState(0)
  const [matchWord, setMatchWord] = useState('')

  const triggerRef = useRef<any>()

  useEffect(() => {
    init(data)
  }, [])

  const onChange: PrependParameters<React.ChangeEventHandler<HTMLInputElement>, [value: string]> = (value, event) => {
    const [start, token] = textAtCursorMatchesToken(value, event.target.selectionStart)
    if (!start || !token) {
      closeSuggestion()
    } else {
      openSuggestion(start, token)
      console.log(start, token)
    }
    setCurrentValue(value)
    props.onChange(value)
  }

  const closeSuggestion = () => {
    setSuggestList([])
    triggerRef.current.close()
  }
  const openSuggestion = async (start: number, token: string) => {
    switch (token.charAt(0)) {
      case ':':
        const res = await SearchIndex.search(token.replace(':', ''))
        const emojis = res
          .map(emoji =>
            emoji.skins.map(skin => ({
              name: skin.shortcodes,
              code: skin.native
            }))
          )
          .flatMap(e => e)
        setSuggestList(emojis)
        setStartIndex(start)
        setMatchWord(token)
        triggerRef.current.open()
    }
  }

  const insertItem = (item: SuggestItem) => {
    if (item.code) {
      const str = `${currentValue.slice(0, startIndex - 1)}${item.code} ${currentValue.slice(startIndex + matchWord.length)}`
      props.onChange(str)
    }
    closeSuggestion()
  }

  return (
    <Whisper
      placement="bottomStart"
      speaker={({ className, left, top }, ref) => (
        <AutoCompleteList className={className} left={left} top={top} data={suggestList} onSelect={insertItem} ref={ref} />
      )}
      ref={triggerRef}
      trigger="none"
    >
      <Input {...props} as="textarea" ref={ref} onChange={onChange} />
    </Whisper>
  )
}

type AutoCompleteListProps = {
  className: string
  left?: number
  top?: number
  data: Array<SuggestItem>
  onSelect: (item: SuggestItem) => void
}

const AutoCompleteList = forwardRef<HTMLDivElement, AutoCompleteListProps>((props, ref) => {
  const { left, top, className, data } = props
  const [highlight, setHighlight] = useState(0)

  const select = (index: number) => {
    props.onSelect(data[index])
  }

  return (
    <Popover ref={ref} className={className} style={{ left, top }}>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2em' }}>
        {data.map((d, index) => (
          <li
            key={index}
            onMouseOver={() => setHighlight(index)}
            onClick={() => select(index)}
            style={{ padding: '4px', backgroundColor: highlight === index ? 'var(--rs-primary-900)' : 'inherit' }}
          >
            {d.code && <span style={{ paddingRight: '4px' }}>{d.code}</span>}
            <span>{d.name}</span>
          </li>
        ))}
      </ul>
    </Popover>
  )
})

// Refs: https://github.com/mastodon/mastodon/blob/7ecf783dd3bfc07f80aab495273b6d01ba972c40/app/javascript/mastodon/components/autosuggest_textarea.jsx#L11
const textAtCursorMatchesToken = (str: string, caretPosition: number): [number | null, string | null] => {
  let word: string

  let left = str.slice(0, caretPosition).search(/\S+$/)
  let right = str.slice(caretPosition).search(/\s/)

  if (right < 0) {
    word = str.slice(left)
  } else {
    word = str.slice(left, right + caretPosition)
  }

  if (!word || word.trim().length < 3 || ['@', ':', '#'].indexOf(word[0]) === -1) {
    return [null, null]
  }

  word = word.trim().toLowerCase()

  if (word.length > 0) {
    return [left + 1, word]
  } else {
    return [null, null]
  }
}

export default AutoCompleteTextarea
