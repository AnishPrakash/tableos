const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemma-4-31b-it:free'

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  systemPrompt?: string,
  maxTokens: number = 800
): Promise<string> {
  const allMessages: OpenRouterMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'TableOS Restaurant Management',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: allMessages,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} — ${error}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

export async function getMenuRecommendations(
  orderHistory: string[],
  availableItems: string[],
  overstockedItems: string[]
): Promise<{ dish: string; reason: string }[]> {
  const prompt = `You are a restaurant AI assistant. Recommend exactly 3 dishes based on the data below.

Customer's previous orders: ${orderHistory.join(', ') || 'First visit'}
Available dishes: ${availableItems.join(', ')}
Overstocked items (prioritize these): ${overstockedItems.join(', ') || 'None'}

Rules:
- Only recommend dishes from the available list
- Respond ONLY with a valid JSON array, no markdown, no extra text
- Format: [{"dish": "Dish Name", "reason": "Short reason under 60 chars"}]`

  try {
    const result = await callOpenRouter([{ role: 'user', content: prompt }])
    const clean = result.replace(/```json|```/g, '').trim()
    // Extract JSON array even if model adds extra text
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    // Fallback: return first 3 available items
    return availableItems.slice(0, 3).map((dish) => ({
      dish,
      reason: 'Popular choice at our restaurant',
    }))
  }
}

export async function getOperationalInsights(analyticsData: {
  totalRevenue: number
  totalOrders: number
  topItems: string[]
  wasteItems: string[]
  lowStockItems: string[]
  weeklyRevenueTrend: number[]
}): Promise<{ title: string; insight: string; action: string; priority: 'high' | 'medium' | 'low' }[]> {
  const prompt = `You are a restaurant business intelligence AI. Analyze this data and provide 3 actionable insights.

Revenue (this week): ₹${analyticsData.totalRevenue}
Total orders: ${analyticsData.totalOrders}
Top selling items: ${analyticsData.topItems.join(', ')}
Waste items: ${analyticsData.wasteItems.join(', ') || 'None logged'}
Low stock: ${analyticsData.lowStockItems.join(', ') || 'None'}
Revenue trend (last 7 days): ${analyticsData.weeklyRevenueTrend.join(', ')}

Rules:
- Respond ONLY with a valid JSON array, no markdown, no extra text
- Format: [{"title": "Short title", "insight": "Observation", "action": "Specific action to take", "priority": "high|medium|low"}]`

  try {
    const result = await callOpenRouter([{ role: 'user', content: prompt }])
    const clean = result.replace(/```json|```/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return [
      {
        title: 'Review Your Top Items',
        insight: 'Focus on promoting your bestselling dishes.',
        action: 'Create combo offers around top items.',
        priority: 'medium' as const,
      },
    ]
  }
}