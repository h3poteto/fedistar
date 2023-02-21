import { Input } from 'rsuite'

type ArgProps = {}

const AutoCompleteTextarea: React.ForwardRefRenderFunction<HTMLTextAreaElement, ArgProps> = (props, ref) => {
  return <Input {...props} as="textarea" ref={ref} />
}

// Refs: https://github.com/mastodon/mastodon/blob/7ecf783dd3bfc07f80aab495273b6d01ba972c40/app/javascript/mastodon/components/autosuggest_textarea.jsx#L11
const textAtCursorMatchesToken = (str: string, caretPosition: number) => {
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
