import { IUser } from './iuser';

export interface IAuthResponse {
  token: string;
  message?: string;
  isAuthenticated: boolean;
  email?: string;
  fullName?: string;
    user: IUser;

}