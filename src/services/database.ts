import { PrismaClient } from '@prisma/client';
import { 
  User, 
  UserCreate, 
  UserUpdate, 
  Property, 
  PropertyCreate, 
  PropertyUpdate, 
  PropertySearch,
  RentAgreement,
  RentAgreementCreate,
  RentAgreementUpdate,
  Payment,
  PaymentCreate,
  PaymentUpdate,
  UserType,
  PaymentMode,
  PaymentStatus,
  PrivyLinkedAccount
} from '../types';

class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // User Service
  user = {
    create: async (data: UserCreate): Promise<User> => {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          userType: data.userType as UserType,
          hashedPassword: data.password ? await this.hashPassword(data.password) : undefined,
        },
      });
      return this.mapUserToInterface(user);
    },

    findById: async (id: number): Promise<User | null> => {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      return user ? this.mapUserToInterface(user) : null;
    },

    findByEmail: async (email: string): Promise<User | null> => {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      return user ? this.mapUserToInterface(user) : null;
    },

    findByPrivyId: async (privyId: string): Promise<User | null> => {
      const user = await this.prisma.user.findUnique({
        where: { privyId },
      });
      return user ? this.mapUserToInterface(user) : null;
    },

    update: async (id: number, data: UserUpdate): Promise<User | null> => {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          username: data.username,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          userType: data.userType as UserType,
        },
      });
      return this.mapUserToInterface(user);
    },

    delete: async (id: number): Promise<boolean> => {
      try {
        await this.prisma.user.delete({
          where: { id },
        });
        return true;
      } catch {
        return false;
      }
    },

    createPrivyUser: async (data: {
      privyId: string;
      profileId?: string;
      email?: string;
      fullName?: string;
      embeddedWallet?: string;
      embeddedWalletDelegated?: boolean;
      accountId?: string;
      isDelegated?: boolean;
      linkedAccounts?: PrivyLinkedAccount[];
    }): Promise<User> => {
      const user = await this.prisma.user.create({
        data: {
          privyId: data.privyId,
          profileId: data.profileId,
          email: data.email,
          fullName: data.fullName,
          embeddedWallet: data.embeddedWallet,
          embeddedWalletDelegated: data.embeddedWalletDelegated || false,
          accountId: data.accountId,
          isDelegated: data.isDelegated || false,
          linkedAccounts: data.linkedAccounts ? JSON.stringify(data.linkedAccounts) : null,
        },
      });
      return this.mapUserToInterface(user);
    },

    updateLinkedAccounts: async (id: number, linkedAccounts: PrivyLinkedAccount[]): Promise<User | null> => {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          linkedAccounts: JSON.stringify(linkedAccounts),
        },
      });
      return this.mapUserToInterface(user);
    },
  };

  // Property Service
  property = {
    create: async (data: PropertyCreate, ownerId: number): Promise<Property> => {
      const property = await this.prisma.property.create({
        data: {
          title: data.title,
          description: data.description,
          numberOfRooms: data.numberOfRooms,
          hasKitchen: data.hasKitchen || false,
          hasBathroom: data.hasBathroom || false,
          numberOfBathrooms: data.numberOfBathrooms || 1,
          rentAmount: data.rentAmount,
          depositAmount: data.depositAmount || 0.0,
          paymentMode: data.paymentMode as PaymentMode,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          ownerId,
        },
      });
      return this.mapPropertyToInterface(property);
    },

    findById: async (id: number): Promise<Property | null> => {
      const property = await this.prisma.property.findUnique({
        where: { id },
        include: { owner: true },
      });
      return property ? this.mapPropertyToInterface(property) : null;
    },

    findMany: async (search?: PropertySearch): Promise<Property[]> => {
      const where: any = {};

      if (search) {
        if (search.city) where.city = { contains: search.city, mode: 'insensitive' };
        if (search.state) where.state = { contains: search.state, mode: 'insensitive' };
        if (search.country) where.country = { contains: search.country, mode: 'insensitive' };
        if (search.pincode) where.pincode = search.pincode;
        if (search.minRent || search.maxRent) {
          where.rentAmount = {};
          if (search.minRent) where.rentAmount.gte = search.minRent;
          if (search.maxRent) where.rentAmount.lte = search.maxRent;
        }
        if (search.minRooms || search.maxRooms) {
          where.numberOfRooms = {};
          if (search.minRooms) where.numberOfRooms.gte = search.minRooms;
          if (search.maxRooms) where.numberOfRooms.lte = search.maxRooms;
        }
        if (search.hasKitchen !== undefined) where.hasKitchen = search.hasKitchen;
        if (search.hasBathroom !== undefined) where.hasBathroom = search.hasBathroom;
        if (search.paymentMode) where.paymentMode = search.paymentMode as PaymentMode;
        if (search.isOccupied !== undefined) where.isOccupied = search.isOccupied;
      }

      const properties = await this.prisma.property.findMany({
        where,
        include: { owner: true },
        orderBy: { createdAt: 'desc' },
      });

      return properties.map(property => this.mapPropertyToInterface(property));
    },

    update: async (id: number, data: PropertyUpdate): Promise<Property | null> => {
      const property = await this.prisma.property.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          numberOfRooms: data.numberOfRooms,
          hasKitchen: data.hasKitchen,
          hasBathroom: data.hasBathroom,
          numberOfBathrooms: data.numberOfBathrooms,
          rentAmount: data.rentAmount,
          depositAmount: data.depositAmount,
          paymentMode: data.paymentMode as PaymentMode,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          isOccupied: data.isOccupied,
          isActive: data.isActive,
        },
        include: { owner: true },
      });
      return this.mapPropertyToInterface(property);
    },

    delete: async (id: number): Promise<boolean> => {
      try {
        await this.prisma.property.delete({
          where: { id },
        });
        return true;
      } catch {
        return false;
      }
    },

    updateEnhancedDescription: async (id: number, enhancedDescription: string): Promise<Property | null> => {
      const property = await this.prisma.property.update({
        where: { id },
        data: { enhancedDescription },
        include: { owner: true },
      });
      return this.mapPropertyToInterface(property);
    },
  };

  // Rent Agreement Service
  rentAgreement = {
    create: async (data: RentAgreementCreate): Promise<RentAgreement> => {
      const agreementNumber = await this.generateAgreementNumber();
      
      const rentAgreement = await this.prisma.rentAgreement.create({
        data: {
          agreementNumber,
          startDate: data.startDate,
          endDate: data.endDate,
          agreementSpanMonths: data.agreementSpanMonths,
          monthlyRent: data.monthlyRent,
          securityDeposit: data.securityDeposit,
          paymentMode: data.paymentMode as PaymentMode,
          conditions: data.conditions,
          specialTerms: data.specialTerms,
          propertyId: data.propertyId,
          tenantId: data.tenantId,
        },
        include: { property: true, tenant: true },
      });
      return this.mapRentAgreementToInterface(rentAgreement);
    },

    findById: async (id: number): Promise<RentAgreement | null> => {
      const rentAgreement = await this.prisma.rentAgreement.findUnique({
        where: { id },
        include: { property: true, tenant: true },
      });
      return rentAgreement ? this.mapRentAgreementToInterface(rentAgreement) : null;
    },

    findByPropertyId: async (propertyId: number): Promise<RentAgreement[]> => {
      const rentAgreements = await this.prisma.rentAgreement.findMany({
        where: { propertyId },
        include: { property: true, tenant: true },
        orderBy: { createdAt: 'desc' },
      });
      return rentAgreements.map(agreement => this.mapRentAgreementToInterface(agreement));
    },

    findByTenantId: async (tenantId: number): Promise<RentAgreement[]> => {
      const rentAgreements = await this.prisma.rentAgreement.findMany({
        where: { tenantId },
        include: { property: true, tenant: true },
        orderBy: { createdAt: 'desc' },
      });
      return rentAgreements.map(agreement => this.mapRentAgreementToInterface(agreement));
    },

    update: async (id: number, data: RentAgreementUpdate): Promise<RentAgreement | null> => {
      const rentAgreement = await this.prisma.rentAgreement.update({
        where: { id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          agreementSpanMonths: data.agreementSpanMonths,
          monthlyRent: data.monthlyRent,
          securityDeposit: data.securityDeposit,
          paymentMode: data.paymentMode as PaymentMode,
          conditions: data.conditions,
          specialTerms: data.specialTerms,
          isActive: data.isActive,
          isTerminated: data.isTerminated,
          terminationDate: data.terminationDate,
          terminationReason: data.terminationReason,
        },
        include: { property: true, tenant: true },
      });
      return this.mapRentAgreementToInterface(rentAgreement);
    },

    delete: async (id: number): Promise<boolean> => {
      try {
        await this.prisma.rentAgreement.delete({
          where: { id },
        });
        return true;
      } catch {
        return false;
      }
    },
  };

  // Payment Service
  payment = {
    create: async (data: PaymentCreate): Promise<Payment> => {
      const paymentReference = await this.generatePaymentReference();
      
      const payment = await this.prisma.payment.create({
        data: {
          paymentReference,
          amount: data.amount,
          currency: data.currency || 'USD',
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          paymentPeriodStart: data.paymentPeriodStart,
          paymentPeriodEnd: data.paymentPeriodEnd,
          dueDate: data.dueDate,
          description: data.description,
          notes: data.notes,
          payerId: data.payerId,
          rentAgreementId: data.rentAgreementId,
        },
        include: { payer: true, rentAgreement: true },
      });
      return this.mapPaymentToInterface(payment);
    },

    findById: async (id: number): Promise<Payment | null> => {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: { payer: true, rentAgreement: true },
      });
      return payment ? this.mapPaymentToInterface(payment) : null;
    },

    findByRentAgreementId: async (rentAgreementId: number): Promise<Payment[]> => {
      const payments = await this.prisma.payment.findMany({
        where: { rentAgreementId },
        include: { payer: true, rentAgreement: true },
        orderBy: { createdAt: 'desc' },
      });
      return payments.map(payment => this.mapPaymentToInterface(payment));
    },

    findByPayerId: async (payerId: number): Promise<Payment[]> => {
      const payments = await this.prisma.payment.findMany({
        where: { payerId },
        include: { payer: true, rentAgreement: true },
        orderBy: { createdAt: 'desc' },
      });
      return payments.map(payment => this.mapPaymentToInterface(payment));
    },

    update: async (id: number, data: PaymentUpdate): Promise<Payment | null> => {
      const payment = await this.prisma.payment.update({
        where: { id },
        data: {
          amount: data.amount,
          currency: data.currency,
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          status: data.status as PaymentStatus,
          paymentPeriodStart: data.paymentPeriodStart,
          paymentPeriodEnd: data.paymentPeriodEnd,
          dueDate: data.dueDate,
          description: data.description,
          notes: data.notes,
          paidAt: data.paidAt,
        },
        include: { payer: true, rentAgreement: true },
      });
      return this.mapPaymentToInterface(payment);
    },

    delete: async (id: number): Promise<boolean> => {
      try {
        await this.prisma.payment.delete({
          where: { id },
        });
        return true;
      } catch {
        return false;
      }
    },
  };

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 12);
  }

  private async generateAgreementNumber(): Promise<string> {
    const count = await this.prisma.rentAgreement.count();
    return `RA${String(count + 1).padStart(6, '0')}`;
  }

  private async generatePaymentReference(): Promise<string> {
    const count = await this.prisma.payment.count();
    return `PAY${String(count + 1).padStart(8, '0')}`;
  }

  // Mapping methods
  private mapUserToInterface(user: any): User {
    return {
      id: user.id,
      privyId: user.privyId,
      profileId: user.profileId,
      embeddedWallet: user.embeddedWallet,
      embeddedWalletDelegated: user.embeddedWalletDelegated,
      accountId: user.accountId,
      linkedAccounts: user.linkedAccounts ? JSON.parse(user.linkedAccounts) : undefined,
      email: user.email,
      username: user.username,
      hashedPassword: user.hashedPassword,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      userType: user.userType,
      isActive: user.isActive,
      isDelegated: user.isDelegated,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapPropertyToInterface(property: any): Property {
    return {
      id: property.id,
      title: property.title,
      description: property.description,
      enhancedDescription: property.enhancedDescription,
      numberOfRooms: property.numberOfRooms,
      hasKitchen: property.hasKitchen,
      hasBathroom: property.hasBathroom,
      numberOfBathrooms: property.numberOfBathrooms,
      rentAmount: property.rentAmount,
      depositAmount: property.depositAmount,
      paymentMode: property.paymentMode,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      pincode: property.pincode,
      isOccupied: property.isOccupied,
      isActive: property.isActive,
      ownerId: property.ownerId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private mapRentAgreementToInterface(agreement: any): RentAgreement {
    return {
      id: agreement.id,
      agreementNumber: agreement.agreementNumber,
      startDate: agreement.startDate,
      endDate: agreement.endDate,
      agreementSpanMonths: agreement.agreementSpanMonths,
      monthlyRent: agreement.monthlyRent,
      securityDeposit: agreement.securityDeposit,
      paymentMode: agreement.paymentMode,
      conditions: agreement.conditions,
      specialTerms: agreement.specialTerms,
      isActive: agreement.isActive,
      isTerminated: agreement.isTerminated,
      terminationDate: agreement.terminationDate,
      terminationReason: agreement.terminationReason,
      propertyId: agreement.propertyId,
      tenantId: agreement.tenantId,
      createdAt: agreement.createdAt,
      updatedAt: agreement.updatedAt,
    };
  }

  private mapPaymentToInterface(payment: any): Payment {
    return {
      id: payment.id,
      paymentReference: payment.paymentReference,
      amount: payment.amount,
      currency: payment.currency,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      x402PaymentId: payment.x402PaymentId,
      x402TransactionHash: payment.x402TransactionHash,
      paymentPeriodStart: payment.paymentPeriodStart,
      paymentPeriodEnd: payment.paymentPeriodEnd,
      dueDate: payment.dueDate,
      description: payment.description,
      notes: payment.notes,
      payerId: payment.payerId,
      rentAgreementId: payment.rentAgreementId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paidAt: payment.paidAt,
    };
  }
}

// Create singleton instance
export const db = new DatabaseService();
export default db;
