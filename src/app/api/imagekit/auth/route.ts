import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

  if (!publicKey || !privateKey || !urlEndpoint) {
    return NextResponse.json({ error: 'ImageKit is not configured' }, { status: 500 })
  }

  const token = crypto.randomUUID()
  const expire = Math.floor(Date.now() / 1000) + 60 * 30
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex')

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint,
  })
}
