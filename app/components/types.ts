export type Contact = {
  id: string
  name: string
  phone: string
  createdAt: string
  calls: Call[]
}

export type Call = {
  id: string
  contactId: string
  vapiCallId: string | null
  status: string
  transcript: string | null
  recordingUrl: string | null
  summary: string | null
  duration: number | null
  startedAt: string
  endedAt: string | null
  createdAt: string
  contact?: Contact
  analysis?: string | null
}

export type AnalysisResult = {
  summary: string
  call_duration: {
    total: string
    agent_talk_percentage: string
    customer_talk_percentage: string
  }
  problem_statement: string
  solution_provided: string
  resolution_status: 'Resolved' | 'Unresolved' | 'Partially Resolved' | 'Not Applicable'
  resolution_explanation: string
  customer_tone: string
  agent_tone: string
  customer_satisfaction: 'Satisfied' | 'Unsatisfied' | 'Neutral' | 'Unknown'
  satisfaction_explanation: string
  agent_behavior: {
    overall: string
    positives: string[]
    improvements: string[]
  }
  key_moments: string[]
  sentiment_score: number
  recommendation: string
}
