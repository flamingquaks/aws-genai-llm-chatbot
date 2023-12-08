import { ApiResult, UserData } from "../../types";
import { ApiClientBase } from "../api-client-base";

export class UsersClient extends ApiClientBase {
  async getUsers(): Promise<ApiResult<UserData[]>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(this.getApiUrl("/admin/users"), {
        headers,
      });
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async getUser(email: string): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(this.getApiUrl(`/admin/users/${email}`), {
        headers,
      });
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async createUser(user: UserData): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(this.getApiUrl(`/admin/users`), {
        method: "PUT",
        headers,
        body: JSON.stringify(user),
      });
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async updateUser(user: UserData): Promise<ApiResult<UserData>> {
    try {
      if (!user.previousEmail) {
        user.previousEmail = user.email;
      }
      const headers = await this.getHeaders();
      user.update_action = "update_details";
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.previousEmail)}`),
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(user),
        }
      );
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async disableUser(user: UserData): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      user.update_action = "disable_user";
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}`),
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(user),
        }
      );
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async enableUser(user: UserData): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      user.update_action = "enable_user";
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}`),
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(user),
        }
      );
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async deleteUser(user: UserData): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}`),
        {
          method: "DELETE",
          headers,
        }
      );
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }

  async resetUserPassword(user: UserData): Promise<ApiResult<UserData>> {
    try {
      const headers = await this.getHeaders();
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}/reset-password`),
        {
          method: "GET",
          headers,
        }
      );
      return result.json();
    } catch (error) {
      return this.error(error);
    }
  }
}
