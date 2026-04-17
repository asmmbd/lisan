import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY

export async function POST(req: NextRequest) {
  try {
    if (!DAILY_API_KEY) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      )
    }

    // Create a new Daily.co room
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `lisan-practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        privacy: 'public', // Anyone with the link can join
        properties: {
          max_participants: 2, // Only 2 people for 1-on-1 practice
          enable_screenshare: false,
          enable_chat: false,
          enable_knocking: false,
          enable_network_ui: false,
          enable_hand_raising: false,
          start_audio_off: false,
          start_video_off: false,
          lang: 'bn',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Daily.co API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create room', details: errorData },
        { status: 500 }
      )
    }

    const roomData = await response.json()
    
    return NextResponse.json({
      success: true,
      room: {
        url: roomData.url,
        name: roomData.name,
        config: roomData.config,
      },
    })

  } catch (error) {
    console.error('Error creating Daily room:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get room info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomName = searchParams.get('name')

  if (!roomName) {
    return NextResponse.json(
      { error: 'Room name required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const roomData = await response.json()
    return NextResponse.json({ room: roomData })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}
