import Hapi from '@hapi/hapi'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { statusCodes } from '../constants/status-codes.js'

// Regression for GHSA-8494-f6mr-cjpv: @hapi/content <= 6.0.2 parses
// Content-Disposition parameters in quadratic time. No app route enables
// payload.multipart today, so this builds one on the same @hapi/hapi to prove
// the parser that would serve it is the patched one.
const BOUNDARY = 'scan-5-boundary'
const MAX_PARSE_MS = 1000

const multipartBody = (disposition, value) =>
  `--${BOUNDARY}\r\nContent-Disposition: ${disposition}\r\n\r\n${value}\r\n--${BOUNDARY}--\r\n`

describe('multipart payload parsing', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server()
    server.route({
      method: 'POST',
      path: '/upload',
      options: {
        auth: false,
        payload: { multipart: true, output: 'data', parse: true }
      },
      handler: (request) => request.payload
    })
    await server.initialize()
  })

  afterAll(async () => {
    await server?.stop({ timeout: 0 })
  })

  const post = (payload) =>
    server.inject({
      method: 'POST',
      url: '/upload',
      headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
      payload
    })

  test('serves a multipart payload route', async () => {
    const { statusCode, result } = await post(
      multipartBody('form-data; name="field"', 'value')
    )

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toEqual({ field: 'value' })
  })

  test('rejects a crafted Content-Disposition without quadratic parsing', async () => {
    const crafted = multipartBody(`form-data; ${'x'.repeat(100_000)}`, 'v')

    const started = performance.now()
    const { statusCode } = await post(crafted)
    const elapsed = performance.now() - started

    expect(statusCode).toBe(statusCodes.badRequest)
    expect(elapsed).toBeLessThan(MAX_PARSE_MS)
  })
})
