# Abliteration.ai Provider for the Vercel AI SDK

This package provides an Abliteration.ai provider for the Vercel AI SDK.

For endpoint behavior, model capabilities, API keys, and examples, use the
official docs at <https://docs.abliteration.ai>.

## Install

```sh
npm install @abliterationai/ai-sdk-provider ai
```

## Usage

```ts
import { generateText } from 'ai';
import { abliteration } from '@abliterationai/ai-sdk-provider';

const { text } = await generateText({
  model: abliteration.chat('abliterated-model'),
  prompt: 'Hello',
});
```

Set `ABLIT_KEY` or pass `apiKey` to `createAbliteration`.

```ts
import { createAbliteration } from '@abliterationai/ai-sdk-provider';

const ablit = createAbliteration({
  apiKey: process.env.ABLIT_KEY,
});
```

## API Surfaces

```ts
abliteration.chat('abliterated-model'); // /v1/chat/completions
abliteration.responses('abliterated-model'); // /v1/responses
abliteration.messages('abliterated-model'); // /v1/messages
```

The callable provider defaults to the chat-completions surface:

```ts
abliteration('abliterated-model');
```

## Docs

- Quickstart: <https://docs.abliteration.ai/quickstart>
- Vercel AI SDK: <https://docs.abliteration.ai/integrations/vercel-ai-sdk>
- API overview: <https://docs.abliteration.ai/api/introduction>
- Product Site: <https://abliteration.ai>
