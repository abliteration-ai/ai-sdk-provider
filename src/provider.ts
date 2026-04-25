import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const DEFAULT_BASE_URL = 'https://api.abliteration.ai';

type OpenAIProvider = ReturnType<typeof createOpenAI>;
type AnthropicProvider = ReturnType<typeof createAnthropic>;

export type AbliterationModelId = 'abliterated-model' | (string & {});

export type AbliterationChatLanguageModel = ReturnType<OpenAIProvider['chat']>;
export type AbliterationResponsesLanguageModel = ReturnType<
  OpenAIProvider['responses']
>;
export type AbliterationMessagesLanguageModel = ReturnType<
  AnthropicProvider['messages']
>;

export interface AbliterationProviderSettings {
  /**
   * Root Abliteration API URL. Defaults to `https://api.abliteration.ai`.
   * If `/v1` is supplied, it is used directly for compatibility calls.
   */
  baseURL?: string;

  /**
   * @deprecated Use `baseURL` instead.
   */
  baseUrl?: string;

  /**
   * OpenAI-compatible base URL. Defaults to `${baseURL}/v1`.
   */
  openAIBaseURL?: string;

  /**
   * Anthropic-compatible base URL. Defaults to `${baseURL}/v1`.
   */
  anthropicBaseURL?: string;

  /**
   * Abliteration API key. Defaults to the `ABLIT_KEY` environment variable.
   */
  apiKey?: string;

  /**
   * Custom headers to include in every request.
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation, useful for testing or request middleware.
   */
  fetch?: typeof fetch;
}

export interface AbliterationProvider {
  (modelId: AbliterationModelId): AbliterationChatLanguageModel;

  languageModel(modelId: AbliterationModelId): AbliterationChatLanguageModel;

  /**
   * Creates a model that uses `/v1/chat/completions`.
   */
  chat(modelId: AbliterationModelId): AbliterationChatLanguageModel;

  /**
   * Creates a model that uses `/v1/responses`.
   */
  responses(modelId: AbliterationModelId): AbliterationResponsesLanguageModel;

  /**
   * Creates a model that uses `/v1/messages`.
   */
  messages(modelId: AbliterationModelId): AbliterationMessagesLanguageModel;
}

function withoutTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function normalizeBaseURL(baseURL: string | undefined): string {
  return withoutTrailingSlash(baseURL ?? DEFAULT_BASE_URL);
}

function toOpenAIBaseURL(rootBaseURL: string): string {
  return rootBaseURL.endsWith('/v1') ? rootBaseURL : `${rootBaseURL}/v1`;
}

function toAnthropicBaseURL(rootBaseURL: string): string {
  return toOpenAIBaseURL(rootBaseURL);
}

function loadAbliterationApiKey(apiKey: string | undefined): string {
  const resolvedApiKey = apiKey ?? process.env.ABLIT_KEY;

  if (!resolvedApiKey) {
    throw new Error(
      'Abliteration API key is missing. Pass apiKey to createAbliteration(...) or set ABLIT_KEY.',
    );
  }

  return resolvedApiKey;
}

/**
 * Create an Abliteration provider instance.
 */
export function createAbliteration(
  options: AbliterationProviderSettings = {},
): AbliterationProvider {
  const rootBaseURL = normalizeBaseURL(options.baseURL ?? options.baseUrl);
  const openAIBaseURL = normalizeBaseURL(
    options.openAIBaseURL ?? toOpenAIBaseURL(rootBaseURL),
  );
  const anthropicBaseURL = normalizeBaseURL(
    options.anthropicBaseURL ?? toAnthropicBaseURL(rootBaseURL),
  );

  const getOpenAIProvider = () =>
    createOpenAI({
      name: 'abliteration',
      baseURL: openAIBaseURL,
      apiKey: loadAbliterationApiKey(options.apiKey),
      headers: options.headers,
      fetch: options.fetch,
    });

  const getAnthropicProvider = () =>
    createAnthropic({
      baseURL: anthropicBaseURL,
      authToken: loadAbliterationApiKey(options.apiKey),
      headers: options.headers,
      fetch: options.fetch,
    });

  const createChatModel = (modelId: AbliterationModelId) =>
    getOpenAIProvider().chat(modelId);

  const createResponsesModel = (modelId: AbliterationModelId) =>
    getOpenAIProvider().responses(modelId);

  const createMessagesModel = (modelId: AbliterationModelId) =>
    getAnthropicProvider().messages(modelId);

  const provider = ((modelId: AbliterationModelId) =>
    createChatModel(modelId)) as AbliterationProvider;

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;
  provider.responses = createResponsesModel;
  provider.messages = createMessagesModel;

  return provider;
}

/**
 * Default Abliteration provider instance. Uses the `ABLIT_KEY` environment
 * variable for authentication.
 */
export const abliteration = createAbliteration();
