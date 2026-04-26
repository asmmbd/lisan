'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useLanguage } from '@/components/lisan/language-provider'

export function PushNotificationSettings() {
  const { isSupported, permission, subscription, subscribe, unsubscribe } = usePushNotifications()
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleEnable = async () => {
    setIsLoading(true)
    const success = await subscribe()
    setIsLoading(false)
    
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const handleDisable = async () => {
    setIsLoading(true)
    await unsubscribe()
    setIsLoading(false)
  }

  const handleTest = async () => {
    try {
      const response = await fetch('/api/push/test-notify', { method: 'POST' })
      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }

  if (!isSupported) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            নোটিফিকেশন অপসমর্থিত
          </CardTitle>
          <CardDescription>
            আপনার ব্রাউজার পুশ নোটিফিকেশন সাপোর্ট করে না। অনুগ্রহ করে Chrome বা Edge ব্যবহার করুন।
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {subscription ? (
            <Bell className="w-5 h-5 text-green-500" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          পুশ নোটিফিকেশন
        </CardTitle>
        <CardDescription>
          অ্যাপ বন্ধ থাকলেও কল এবং ম্যাচ নোটিফিকেশন পান
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'denied' ? (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                নোটিফিকেশন ব্লক করা হয়েছে
              </p>
              <p className="text-sm text-amber-700 mt-1">
                ব্রাউজার সেটিংস থেকে নোটিফিকেশন অনুমতি দিন। Chrome: সাইট সেটিংস → অনুমতি → নোটিফিকেশন
              </p>
            </div>
          </div>
        ) : subscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">পুশ নোটিফিকেশন সক্রিয়!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              এখন অ্যাপ বন্ধ থাকলেও আপনি কল এবং ম্যাচ নোটিফিকেশন পাবেন।
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isLoading}
              >
                <Bell className="w-4 h-4 mr-2" />
                টেস্ট নোটিফিকেশন
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisable}
                disabled={isLoading}
              >
                <BellOff className="w-4 h-4 mr-2" />
                বন্ধ করুন
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              কল এবং ম্যাচ নোটিফিকেশন পেতে পুশ নোটিফিকেশন সক্রিয় করুন। এটি অ্যাপ বন্ধ থাকলেও কাজ করবে।
            </p>
            <Button
              onClick={handleEnable}
              disabled={isLoading || (permission as string) === 'denied'}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isLoading ? 'সক্রিয় হচ্ছে...' : 'পুশ নোটিফিকেশন সক্রিয় করুন'}
            </Button>
          </div>
        )}

        {showSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">অপারেশন সফল!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
