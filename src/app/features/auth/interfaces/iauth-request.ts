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

export interface IConfirmEmailOtpRequest {
  email: string;
  otpCodeEmail: string;
  accountType?: 'customer' | 'vendor';
}

export interface IResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ICompleteGoogleRegistrationRequest {
  registrationToken: string;
  password: string;
  confirmPassword: string;
}

