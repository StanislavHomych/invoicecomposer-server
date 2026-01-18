import prisma from '../utils/prisma';

export async function getCompanyByUserId(userId: string) {
  return await prisma.company.findUnique({
    where: { userId },
  });
}

export async function createCompany(userId: string, data: {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  bankDetails?: string;
  taxIdLabel?: string;
  taxIdValue?: string;
  timeZone?: string;
}) {
  return await prisma.company.create({
    data: {
      userId,
      ...data,
    },
  });
}

export async function updateCompany(userId: string, data: {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  bankDetails?: string;
  taxIdLabel?: string;
  taxIdValue?: string;
  timeZone?: string;
}) {
  return await prisma.company.update({
    where: { userId },
    data,
  });
}

export async function upsertCompany(userId: string, data: {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  bankDetails?: string;
  taxIdLabel?: string;
  taxIdValue?: string;
  timeZone?: string;
}) {
  return await prisma.company.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}
