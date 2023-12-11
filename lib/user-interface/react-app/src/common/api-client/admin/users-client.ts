import { ApiResult, UserData, UserDataApiRequest } from "../../types";
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
        method: "POST",
        headers,
        body: JSON.stringify(getApiSafeData(user)),
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
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.previousEmail)}/edit`),
        {
          method: "POST",
          headers,
          body: JSON.stringify(getApiSafeData(user)),
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
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}/disable`),
        {
          method: "POST",
          headers,
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
      const result = await fetch(
        this.getApiUrl(`/admin/users/${encodeURI(user.email)}/enable`),
        {
          method: "POST",
          headers,
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

const getApiSafeData = (user: UserData): UserDataApiRequest => {
  return {
    email: user.email ?? "NONE",
    phoneNumber: user.phoneNumber ?? "NONE",
    role: user.role ? user.role.toString() : "NONE",
    name: user.name ?? "NONE",
  };
};
