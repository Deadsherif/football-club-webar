export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Mock AI layer for MVP. Replace `ask` with a real API call later.
 *
 * Example integration:
 *   const res = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ message }) })
 */
class AIService {
  async ask(message: string, _history: AIMessage[] = []): Promise<string> {
    await delay(500 + Math.random() * 400)
    const q = message.toLowerCase()

    if (q.includes('history') || q.includes('founded') || q.includes('1907')) {
      return 'Al Ahly was founded in 1907 and has built one of the most successful football legacies in Africa. Every generation has added to that story.'
    }
    if (q.includes('trophy') || q.includes('champion') || q.includes('title')) {
      return 'Al Ahly’s trophy cabinet reflects decades of domestic and continental excellence. Official counts should be confirmed with club records.'
    }
    if (q.includes('legend') || q.includes('player')) {
      return 'Al Ahly legends are defined by loyalty, leadership, and moments that shaped Egyptian and African football. Replace placeholders with official club profiles.'
    }
    if (q.includes('stadium') || q.includes('12th')) {
      return 'The fans are the 12th player — the heartbeat of match day. This experience celebrates that bond between club and supporters.'
    }
    if (q.includes('future')) {
      return 'The future of Al Ahly can blend smart stadiums, performance intelligence, and connected digital experiences for fans worldwide.'
    }

    return 'Al Ahly is more than a club — it is a legacy of ambition, community, and excellence. Ask about history, trophies, legends, or the future.'
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const aiService = new AIService()
