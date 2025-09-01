'use client'

import { useEffect } from 'react'

export function VercelDebug() {
  useEffect(() => {
    // Check if Vercel Analytics is loaded
    if (typeof window !== 'undefined') {
      console.log('🔍 Vercel Debug Info:')
      console.log('- Environment:', process.env.NODE_ENV)
      console.log('- User Agent:', navigator.userAgent)
      console.log('- URL:', window.location.href)
      
      // Check for Vercel Analytics script
      const analyticsScript = document.querySelector('script[src*="vercel"]')
      console.log('- Analytics Script Found:', !!analyticsScript)
      
      // Check for Speed Insights
      const speedInsightsScript = document.querySelector('script[src*="speed-insights"]')
      console.log('- Speed Insights Script Found:', !!speedInsightsScript)
      
      // Check window objects
      console.log('- Window.va (Analytics):', !!(window as any).va)
      console.log('- Window.si (Speed Insights):', !!(window as any).si)
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      Vercel Debug Active (Check Console)
    </div>
  )
}
