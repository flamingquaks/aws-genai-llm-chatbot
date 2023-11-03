import { ApiResult, DocumentResult, DocumentItem } from "../types";
import { ApiClientBase } from "./api-client-base";

export class RssClient extends ApiClientBase {
  async getRssFeedSubscriptions(
    workspaceId: string
  ): Promise<ApiResult<DocumentResult>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(
        this.getApiUrl(`/workspaces/${workspaceId}/rss`),
        {
          headers,
        }
      );

      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async addRssFeedSubscription(
    workspaceId: string,
    rssFeedUrl: string,
    rssFeedTitle: string
  ): Promise<ApiResult<DocumentItem>> {
    try {
      const headers = await this.getHeaders();
      const results = await fetch(
        this.getApiUrl(`/workspaces/${workspaceId}/rss`),
        {
          headers: headers,
          method: "POST",
          body: JSON.stringify({ rssFeedUrl, rssFeedTitle }),
        }
      );
      return results.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async deleteRssFeedSubscription(
    workspaceId: string,
    rssFeedTitle: string
  ): Promise<ApiResult<DocumentResult>> {
    try {
      const headers = await this.getHeaders();
      const results = await fetch(
        this.getApiUrl(`/workspaces/${workspaceId}/rss/${rssFeedTitle}`),
        {
          headers: headers,
          method: "DELETE",
        }
      );
      return results.json();
    } catch (error) {
      return this.error(error);
    }
  }
}
