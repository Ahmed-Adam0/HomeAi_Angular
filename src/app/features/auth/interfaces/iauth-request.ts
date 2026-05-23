export interface ILoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface IRegisterRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}
