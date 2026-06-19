'use client'

import { useEffect, useState } from 'react'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<object | null>(null)

  useEffect(() => {
    fetch('/api/swagger')
      .then(res => res.json())
      .then(data => setSpec(data))
  }, [])

  if (!spec) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat dokumentasi API...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <SwaggerUI
        spec={spec}
        persistAuthorization
        displayRequestDuration
        defaultModelsExpandDepth={-1}
        tryItOutEnabled
      />
    </div>
  )
}
