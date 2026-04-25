import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';
import { createAbliteration } from '../src';

type CapturedRequest = {
  body: unknown;
  headers: Headers;
  url: string;
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}

function createFetchRecorder(responseBody: unknown) {
  const requests: CapturedRequest[] = [];

  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push({
      body: await request.json(),
      headers: request.headers,
      url: request.url,
    });

    return jsonResponse(responseBody);
  };

  return { fetch, requests };
}

describe('Abliteration provider', () => {
  it('routes chat models to /v1/chat/completions', async () => {
    const { fetch, requests } = createFetchRecorder({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 0,
      model: 'abliterated-model',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'chat ok' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 2,
        total_tokens: 3,
      },
    });

    const provider = createAbliteration({ apiKey: 'test-key', fetch });
    const result = await generateText({
      model: provider.chat('abliterated-model'),
      prompt: 'Hello',
    });

    expect(result.text).toBe('chat ok');
    expect(requests[0]?.url).toBe(
      'https://api.abliteration.ai/v1/chat/completions',
    );
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer test-key');
    expect(requests[0]?.body).toMatchObject({ model: 'abliterated-model' });
  });

  it('routes responses models to /v1/responses', async () => {
    const { fetch, requests } = createFetchRecorder({
      id: 'resp-test',
      object: 'response',
      created_at: 0,
      status: 'completed',
      model: 'abliterated-model',
      output: [
        {
          id: 'msg-test',
          type: 'message',
          status: 'completed',
          role: 'assistant',
          content: [
            {
              type: 'output_text',
              text: 'responses ok',
              annotations: [],
            },
          ],
        },
      ],
      usage: {
        input_tokens: 1,
        output_tokens: 2,
        total_tokens: 3,
      },
    });

    const provider = createAbliteration({ apiKey: 'test-key', fetch });
    const result = await generateText({
      model: provider.responses('abliterated-model'),
      prompt: 'Hello',
    });

    expect(result.text).toBe('responses ok');
    expect(requests[0]?.url).toBe('https://api.abliteration.ai/v1/responses');
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer test-key');
    expect(requests[0]?.body).toMatchObject({ model: 'abliterated-model' });
  });

  it('routes messages models to /v1/messages', async () => {
    const { fetch, requests } = createFetchRecorder({
      id: 'msg-test',
      type: 'message',
      role: 'assistant',
      model: 'abliterated-model',
      content: [{ type: 'text', text: 'messages ok' }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 1,
        output_tokens: 2,
      },
    });

    const provider = createAbliteration({ apiKey: 'test-key', fetch });
    const result = await generateText({
      model: provider.messages('abliterated-model'),
      prompt: 'Hello',
    });

    expect(result.text).toBe('messages ok');
    expect(requests[0]?.url).toBe('https://api.abliteration.ai/v1/messages');
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer test-key');
    expect(requests[0]?.body).toMatchObject({ model: 'abliterated-model' });
  });

  it('defaults the callable provider to chat completions', async () => {
    const { fetch, requests } = createFetchRecorder({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 0,
      model: 'abliterated-model',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'default ok' },
          finish_reason: 'stop',
        },
      ],
    });

    const provider = createAbliteration({ apiKey: 'test-key', fetch });
    const result = await generateText({
      model: provider('abliterated-model'),
      prompt: 'Hello',
    });

    expect(result.text).toBe('default ok');
    expect(requests[0]?.url).toBe(
      'https://api.abliteration.ai/v1/chat/completions',
    );
  });
});
