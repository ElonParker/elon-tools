export type CustomerRole = 'CUSTOMER' | 'ADMIN';
export type CustomerStatus = 'active' | 'suspended' | 'deleted';

export interface Customer {
  id: string;
  email: string;
  role: CustomerRole;
  status: CustomerStatus;
  name: string | null;
  created_at: string;
  updated_at: string;
}
