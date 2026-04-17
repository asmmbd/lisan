import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

const APP_ID = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        { error: 'Agora credentials not configured' },
        { status: 500 }
      )
    }

    const { channel, uid, role = 'publisher' } = await req.json()

    if (!channel || !uid) {
      return NextResponse.json(
        { error: 'Channel and UID required' },
        { status: 400 }
      )
    }

    // Token expiration time (1 hour = 3600 seconds)
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Determine role
    const userRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

    // Generate token with all required parameters
    const token = (RtcTokenBuilder as any).buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channel,
      parseInt(uid) || 0,
      userRole,
      privilegeExpiredTs,
      privilegeExpiredTs // joinChannelPrivilegeExpireTime
    )

    return NextResponse.json({
      success: true,
      token,
      appId: APP_ID,
      channel,
      uid,
      expiresIn: expirationTimeInSeconds,
    })

  } catch (error) {
    console.error('Error generating Agora token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
