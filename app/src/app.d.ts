import type { Salon, User, Worker, Device } from '$lib/server/db/schema';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      salon: Salon | null;
      device: Device | null;
      locale: 'en' | 'vi';
    }
    interface PageData {
      locale?: 'en' | 'vi';
    }
  }
}
export {};
