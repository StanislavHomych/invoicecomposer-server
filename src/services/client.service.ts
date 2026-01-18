import prisma from '../utils/prisma';

export async function getClientsByUserId(userId: string) {
  return await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClientById(id: string, userId: string) {
  return await prisma.client.findFirst({
    where: { id, userId },
  });
}

export async function createClient(userId: string, data: {
  name: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxIdLabel?: string;
  taxIdValue?: string;
  notes?: string;
}) {
  return await prisma.client.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updateClient(id: string, userId: string, data: {
  name?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxIdLabel?: string;
  taxIdValue?: string;
  notes?: string;
}) {
  return await prisma.client.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteClient(id: string, userId: string) {
  return await prisma.client.deleteMany({
    where: { id, userId },
  });
}
