import { useEffect, useRef, useState, forwardRef, KeyboardEventHandler, Dispatch, SetStateAction } from 'react'
import { Input, Popover, Whisper } from 'rsuite'
import { PrependParameters } from 'rsuite/esm/@types/utils'
import { init, SearchIndex } from 'emoji-mart'
import { data } from 'src/utils/emojiData'
import { CustomEmojiCategory } from 'src/entities/emoji'
import { MegalodonInterface } from 'megalodon'

export type ArgProps = {
  client: MegalodonInterface
  emojis: Array<CustomEmojiCategory>
  onChange: (value: string) => void
}

type SuggestItem = {
  name: string
  code?: string
  icon?: string
}

const AutoCompleteTextarea: React.ForwardRefRenderFunction<HTMLTextAreaElement, ArgProps> = (props, ref) => {
  const [suggestList, setSuggestList] = useState<Array<SuggestItem>>([])
  const [opened, setOpened] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [currentValue, setCurrentValue] = useState<string>('')
  const [startIndex, setStartIndex] = useState(0)
  const [matchWord, setMatchWord] = useState('')

  const triggerRef = useRef<any>()
  const shouldOpen = useRef<boolean>(false)
  const valueRef = useRef<string>('')

  useEffect(() => {
    init(data)
  }, [])

  useEffect(() => {
    valueRef.current = currentValue
  }, [currentValue])

  const onChange: PrependParameters<React.ChangeEventHandler<HTMLInputElement>, [value: string]> = (value, event) => {
    const [start, token] = textAtCursorMatchesToken(value, event.target.selectionStart)
    if (!start || !token) {
      closeSuggestion()
    } else {
      setTimeout(() => {
        if (valueRef.current === value) {
          shouldOpen.current = true
          openSuggestion(start, token)
        }
      }, 500)
    }
    setCurrentValue(value)
    props.onChange(value)
  }

  const closeSuggestion = () => {
    setSuggestList([])
    setHighlight(0)
    setStartIndex(0)
    setMatchWord('')
    triggerRef.current.close()
    shouldOpen.current = false
  }

  const openSuggestion = async (start: number, token: string) => {
    switch (token.charAt(0)) {
      case ':': {
        const res = await SearchIndex.search(token.replace(':', ''))
        const emojis = res
          .map(emoji =>
            emoji.skins.map(skin => ({
              name: skin.shortcodes,
              code: skin.native
            }))
          )
          .flatMap(e => e)
        const custom = props.emojis
          .map(d => d.emojis.filter(e => e.name.includes(token.replace(':', ''))))
          .flatMap(e => e)
          .map(emoji =>
            emoji.skins.map(skin => ({
              name: skin.shortcodes,
              icon: skin.src
            }))
          )
          .flatMap(e => e)
        if (shouldOpen.current) {
          setSuggestList([...emojis, ...custom])
          setStartIndex(start)
          setMatchWord(token)
          triggerRef.current.open()
        }
        return
      }
      case '@': {
        const res = await props.client.searchAccount(token.replace('@', ''))
        if (shouldOpen.current) {
          setSuggestList(
            res.data.map(a => ({
              name: `@${a.acct}`
            }))
          )
          setStartIndex(start)
          setMatchWord(token)
          triggerRef.current.open()
        }
        return
      }
      case '#': {
        const res = await props.client.search(token, { type: 'hashtags' })
        if (shouldOpen.current) {
          setSuggestList(
            res.data.hashtags.map(tag => ({
              name: `#${tag.name}`
            }))
          )
          setStartIndex(start)
          setMatchWord(token)
          triggerRef.current.open()
        }
        return
      }
    }
  }

  const insertItem = (item: SuggestItem) => {
    if (item.code) {
      const str = `${currentValue.slice(0, startIndex - 1)}${item.code} ${currentValue.slice(startIndex + matchWord.length)}`
      props.onChange(str)
    } else {
      const str = `${currentValue.slice(0, startIndex - 1)}${item.name} ${currentValue.slice(startIndex + matchWord.length)}`
      props.onChange(str)
    }
    closeSuggestion()
  }

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = e => {
    if (opened) {
      if (e.code === 'ArrowDown') {
        setHighlight(prev => (prev + 1 < suggestList.length ? prev + 1 : prev))
        e.preventDefault()
      }
      if (e.code === 'ArrowUp') {
        setHighlight(prev => (prev > 0 ? prev - 1 : 0))
        e.preventDefault()
      }
      if (e.code === 'Enter') {
        insertItem(suggestList[highlight])
        e.preventDefault()
      }
      if (e.code === 'Escape') {
        closeSuggestion()
        e.preventDefault()
      }
    }
  }

  return (
    <>
      <Input {...props} as="textarea" ref={ref} onChange={onChange} onKeyDown={onKeyDown} />
      <Whisper
        placement="bottomStart"
        speaker={({ className, left, top }, ref) => (
          <AutoCompleteList
            className={className}
            left={left}
            top={top}
            data={suggestList}
            onSelect={insertItem}
            highlight={highlight}
            setHighlight={setHighlight}
            ref={ref}
          />
        )}
        ref={triggerRef}
        trigger="click"
        onOpen={() => setOpened(true)}
        onClose={() => setOpened(false)}
      >
        <div></div>
      </Whisper>
    </>
  )
}

type AutoCompleteListProps = {
  className: string
  left?: number
  top?: number
  data: Array<SuggestItem>
  onSelect: (item: SuggestItem) => void
  highlight: number
  setHighlight: Dispatch<SetStateAction<number>>
}

const AutoCompleteList = forwardRef<HTMLDivElement, AutoCompleteListProps>((props, ref) => {
  const { left, top, className, data, highlight } = props

  const select = (index: number) => {
    props.onSelect(data[index])
  }

  return (
    <Popover ref={ref} className={className} style={{ left, top }}>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2em' }}>
        {data.map((d, index) => (
          <li
            key={index}
            onMouseOver={() => props.setHighlight(index)}
            onClick={() => select(index)}
            style={{ padding: '4px', backgroundColor: highlight === index ? 'var(--rs-radio-tile-checked-disabled-color)' : 'inherit' }}
          >
            {d.code && <span style={{ paddingRight: '4px' }}>{d.code}</span>}
            {d.icon && (
              <span style={{ paddingRight: '4px' }}>
                <img src={d.icon} style={{ width: '1.2em' }} />
              </span>
            )}
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

  const left = str.slice(0, caretPosition).search(/\S+$/)
  const right = str.slice(caretPosition).search(/\s/)

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
