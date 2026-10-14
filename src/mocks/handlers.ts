import { http, HttpResponse, passthrough } from 'msw'
import { MAX_PAGE_SIZE, PAGE_SIZE } from '../api/contracts'
import { runtimeConfig } from '../api/runtimeConfig'
import { validateSettings } from '../game/sim/settings'
import { listHistory, listRanking, registerMatch, validateSubmission } from './api'
import { hang, planRequest } from './behavior'

const base = runtimeConfig.apiBaseUrl

function errorResponse(status: number, error: string, message: string, details?: string[]) {
  return HttpResponse.json({ error, message, details }, { status })
}

/** Integer query param within [min, max]; null when invalid. */
function readInt(params: URLSearchParams, name: string, fallback: number, min: number, max: number): number | null {
  const raw = params.get(name)
  if (raw === null || raw === '') return fallback
  const n = Number(raw)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

export const handlers = [
  http.get(`${base}/ranking`, async ({ request }) => {
    const plan = await planRequest('ranking')
    if (plan.kind === 'respond') return plan.response
    if (plan.kind !== 'proceed') return hang()

    const query = new URL(request.url).searchParams
    const page = readInt(query, 'page', 1, 1, 10_000)
    const pageSize = readInt(query, 'pageSize', PAGE_SIZE, 1, MAX_PAGE_SIZE)
    const config = {
      sessionDuration: Number(query.get('sessionDuration')),
      enemySpawnInterval: Number(query.get('enemySpawnInterval')),
    }
    if (page === null || pageSize === null || Object.keys(validateSettings(config)).length > 0) {
      return errorResponse(400, 'invalid_query', 'Invalid ranking query.')
    }
    return HttpResponse.json(listRanking({ ...config, page, pageSize }))
  }),

  http.get(`${base}/players/:playerId/matches`, async ({ request, params }) => {
    const plan = await planRequest('history')
    if (plan.kind === 'respond') return plan.response
    if (plan.kind !== 'proceed') return hang()

    const query = new URL(request.url).searchParams
    const page = readInt(query, 'page', 1, 1, 10_000)
    const pageSize = readInt(query, 'pageSize', PAGE_SIZE, 1, MAX_PAGE_SIZE)
    const playerId = typeof params.playerId === 'string' ? params.playerId : ''
    if (page === null || pageSize === null || playerId === '') {
      return errorResponse(400, 'invalid_query', 'Invalid history query.')
    }
    return HttpResponse.json(listHistory(playerId, page, pageSize))
  }),

  http.post(`${base}/matches`, async ({ request }) => {
    const plan = await planRequest('register')
    if (plan.kind === 'respond') return plan.response
    if (plan.kind === 'hang') return hang()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return errorResponse(400, 'invalid_json', 'The request body is not valid JSON.')
    }
    const checked = validateSubmission(body)
    if (!checked.ok) return errorResponse(422, 'validation_error', 'The match record is not valid.', checked.details)

    const result = registerMatch(checked.record) // persisted...
    if (plan.kind === 'persist-then-hang') return hang() // ...but the client never hears back
    return HttpResponse.json(result, { status: result.created ? 201 : 200 })
  }),

  http.all('*', () => passthrough()),
]