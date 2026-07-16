import { Suspense } from 'react'

import ChatView from '@/src/views/apps/chat/ChatView'

const ChatSayaPage = () => {
  return (
    <Suspense fallback={null}>
      <ChatView scope='saya' />
    </Suspense>
  )
}

export default ChatSayaPage
