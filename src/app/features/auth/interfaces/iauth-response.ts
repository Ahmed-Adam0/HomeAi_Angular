import { IUser } from './iuser';

export interface IAuthResponse {
  token?: string;
  accessToken?: string;
  message?: string;
  isAuthenticated: boolean;
  email?: string;
  fullName?: string;
  user: IUser;
  data?: { token?: string };
  result?: { token?: string };
}
