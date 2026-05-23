export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'customer' | 'admin' | 'decorator';
  phoneNumber?: string;
  createdAt: string;
  emailConfirmed: boolean;
}
