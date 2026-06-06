import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { profileUpdateSchema, validateBody } from '@/lib/validation'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateBody(req, profileUpdateSchema)
    if ('response' in validation) return validation.response
    const { name, image } = validation.data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(typeof name === 'string' ? { name } : {}),
        ...(typeof image === 'string' ? { image } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
