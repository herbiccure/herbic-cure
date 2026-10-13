import 'server-only';
import { prisma } from '@/lib/prisma';

export interface AddressInput {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  });
}

export async function createUserAddress(userId: string, data: AddressInput) {
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: {
      userId,
      name: data.name,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,
      isDefault: data.isDefault ?? false,
    },
  });
}

export async function updateUserAddress(userId: string, addressId: string, data: Partial<AddressInput>) {
  // Confirm ownership
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) {
    throw new Error('Address not found');
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data: {
      name: data.name,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,
      isDefault: data.isDefault,
    },
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  // Scoped to userId to eliminate IDOR
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) {
    throw new Error('Address not found');
  }

  return prisma.address.delete({
    where: { id: addressId },
  });
}
