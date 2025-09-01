'use client'

import { track } from '@vercel/analytics'
import { useEffect } from 'react'

export default function AnalyticsTestPage() {
  useEffect(() => {
    // Force trigger analytics event
    track('analytics_test_page_loaded', {
      timestamp: new Date().toISOString(),
      test: true
    })
    
    console.log('Analytics test event sent')
  }, [])

  const handleTestClick = () => {
    track('test_button_clicked', {
      timestamp: new Date().toISOString()
    })
    console.log('Test button analytics event sent')
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Test Page</h1>
      <p className="mb-4">
        This page is designed to test Vercel Analytics integration.
        Check the browser console for debug information.
      </p>
      
      <button 
        onClick={handleTestClick}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Analytics Event
      </button>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
      </div>
    </div>
  )
}
