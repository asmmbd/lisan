import { NextRequest, NextResponse } from 'next/server'
import { aiChatSchema, validateBody } from '@/lib/validation'

const GROQ_API_KEY = process.env.GROQ_API_KEY

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    const validation = await validateBody(req, aiChatSchema)
    if ('response' in validation) return validation.response
    const { messages, system } = validation.data

    // Convert messages to Groq format (OpenAI compatible)
    const groqMessages = system 
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Groq API error:', errorData)
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 502 }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
    })

  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
