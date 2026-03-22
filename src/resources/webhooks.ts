import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Webhook,
  WebhookListParams,
  WebhookCreateInput,
  WebhookUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Webhooks {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List webhook endpoints with pagination.
   *
   * ```ts
   * for await (const webhook of cynco.webhooks.list()) {
   *   console.log(`${webhook.url} — ${webhook.events.join(', ')}`);
   * }
   * ```
   */
  list(params?: WebhookListParams): PagePromise<Webhook> {
    const fetchPage = async (
      p: WebhookListParams,
    ): Promise<PaginatedResponse<Webhook>> => {
      return this._client.getList<Webhook>(
        '/webhooks',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single webhook endpoint by ID. */
  async retrieve(id: string): Promise<Webhook> {
    const response = await this._client.get<Webhook>(`/webhooks/${id}`);
    return response.data;
  }

  /** Create a new webhook endpoint. */
  async create(
    data: WebhookCreateInput,
    options?: RequestOptions,
  ): Promise<Webhook> {
    const response = await this._client.post<Webhook>(
      '/webhooks',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing webhook endpoint. */
  async update(
    id: string,
    data: WebhookUpdateInput,
    options?: RequestOptions,
  ): Promise<Webhook> {
    const response = await this._client.patch<Webhook>(
      `/webhooks/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a webhook endpoint. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/webhooks/${id}`, options);
  }

  /** Rotate the signing secret for a webhook endpoint. Returns the new secret. */
  async rotateSecret(id: string): Promise<{ secret: string }> {
    const response = await this._client.post<{ secret: string }>(
      `/webhooks/${id}/rotate-secret`,
    );
    return response.data;
  }
}
