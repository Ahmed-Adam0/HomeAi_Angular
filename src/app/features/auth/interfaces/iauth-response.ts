import { IUser } from './iuser';

export interface IAuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number; // expiration time in seconds/milliseconds
  user: IUser;
}
