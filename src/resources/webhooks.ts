import type { CyncoClient } from '../client.js';
import type {
  Webhook,
  WebhookCreateInput,
  WebhookCreateResponse,
  WebhookUpdateInput,
  RequestOptions,
} from '../types.js';

export class Webhooks {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List webhook endpoints.
  */
  async list(options?: RequestOptions): Promise<Webhook[]> {
    const response = await this._client.get<Webhook[]>(
      '/webhooks',
      undefined,
      options,
    );
    return response.data;
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
  ): Promise<WebhookCreateResponse> {
    const response = await this._client.post<WebhookCreateResponse>(
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
}
