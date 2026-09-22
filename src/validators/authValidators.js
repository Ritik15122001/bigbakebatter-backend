import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional().default(''),
  addr: z.string().optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const addressSchema = z.object({
  label: z.string().optional().default('Home'),
  line: z.string().min(4, 'Enter the full street address'),
  city: z.string().optional().default(''),
  pin: z.string().optional().default(''),
  isDefault: z.coerce.boolean().optional().default(false),
});

export const addressUpdateSchema = addressSchema.partial();
