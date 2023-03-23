import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Content } from 'rsuite'

type Props = {}

export default function TagDetail(props: Props) {
  const [tag, setTag] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (router.query.tag) {
      setTag(router.query.tag.toString())
    }
  }, [router.query.tag, router.query.server_id, router.query.account_id])

  return <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)', overflowY: 'scroll' }}>#{tag}</Content>
}
