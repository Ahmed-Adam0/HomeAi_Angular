export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string | null;
  preferredLanguage: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IVerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface IResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}
