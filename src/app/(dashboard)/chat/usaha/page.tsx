import { Suspense } from 'react'

import ChatView from '@/src/views/apps/chat/ChatView'

const ChatUsahaPage = () => {
  return (
    <Suspense fallback={null}>
      <ChatView scope='usaha' />
    </Suspense>
  )
}

export default ChatUsahaPage
