import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F9D58 0%, #1B5E20 100%)',
          color: 'white',
          fontSize: 280,
          fontWeight: 800,
          borderRadius: 96,
        }}
      >
        ل
      </div>
    ),
    { width: 512, height: 512 }
  )
}
