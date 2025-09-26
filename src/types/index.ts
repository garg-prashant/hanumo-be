// Enums
export enum UserType {
  TENANT = 'tenant',
  OWNER = 'owner'
}

export enum PaymentMode {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Base interfaces
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;
}

// User interfaces
export interface User extends BaseEntity {
  privyId?: string;
  profileId?: string;
  embeddedWallet?: string;
  accountId?: string;
  email?: string;
  username?: string;
  hashedPassword?: string;
  fullName?: string;
  phoneNumber?: string;
  userType?: UserType;
  isActive: boolean;
}

export interface UserCreate {
  email?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  userType?: UserType;
  password?: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  userType?: UserType;
}

// Privy authentication interfaces
export interface PrivyAuthRequest {
  accessToken: string;
}

export interface PrivyUserData {
  privyId: string;
  profileId?: string;
  email?: string;
  fullName?: string;
  embeddedWallet?: string;
  accountId?: string;
}

export interface PrivyAuthResponse {
  user: User;
  isNewUser: boolean;
}

// Property interfaces
export interface Property extends BaseEntity {
  title: string;
  description?: string;
  enhancedDescription?: string;
  numberOfRooms: number;
  hasKitchen: boolean;
  hasBathroom: boolean;
  numberOfBathrooms: number;
  rentAmount: number;
  depositAmount: number;
  paymentMode: PaymentMode;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isOccupied: boolean;
  isActive: boolean;
  ownerId: number;
}

export interface PropertyCreate {
  title: string;
  description?: string;
  numberOfRooms: number;
  hasKitchen?: boolean;
  hasBathroom?: boolean;
  numberOfBathrooms?: number;
  rentAmount: number;
  depositAmount?: number;
  paymentMode: PaymentMode;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface PropertyUpdate {
  title?: string;
  description?: string;
  numberOfRooms?: number;
  hasKitchen?: boolean;
  hasBathroom?: boolean;
  numberOfBathrooms?: number;
  rentAmount?: number;
  depositAmount?: number;
  paymentMode?: PaymentMode;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isOccupied?: boolean;
  isActive?: boolean;
}

export interface PropertySearch {
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  minRent?: number;
  maxRent?: number;
  minRooms?: number;
  maxRooms?: number;
  hasKitchen?: boolean;
  hasBathroom?: boolean;
  paymentMode?: PaymentMode;
  isOccupied?: boolean;
}

export interface PropertyDescriptionEnhancement {
  keywords: string;
}

// Rent Agreement interfaces
export interface RentAgreement extends BaseEntity {
  agreementNumber: string;
  startDate: Date;
  endDate: Date;
  agreementSpanMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  paymentMode: PaymentMode;
  conditions?: string;
  specialTerms?: string;
  isActive: boolean;
  isTerminated: boolean;
  terminationDate?: Date;
  terminationReason?: string;
  propertyId: number;
  tenantId: number;
}

export interface RentAgreementCreate {
  propertyId: number;
  tenantId: number;
  startDate: Date;
  endDate: Date;
  agreementSpanMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  paymentMode: PaymentMode;
  conditions?: string;
  specialTerms?: string;
}

export interface RentAgreementUpdate {
  startDate?: Date;
  endDate?: Date;
  agreementSpanMonths?: number;
  monthlyRent?: number;
  securityDeposit?: number;
  paymentMode?: PaymentMode;
  conditions?: string;
  specialTerms?: string;
  isActive?: boolean;
  isTerminated?: boolean;
  terminationDate?: Date;
  terminationReason?: string;
}

// Payment interfaces
export interface Payment extends BaseEntity {
  paymentReference: string;
  amount: number;
  currency: string;
  paymentType: string;
  paymentMethod?: string;
  status: PaymentStatus;
  x402PaymentId?: string;
  x402TransactionHash?: string;
  paymentPeriodStart?: Date;
  paymentPeriodEnd?: Date;
  dueDate: Date;
  description?: string;
  notes?: string;
  payerId: number;
  rentAgreementId: number;
  paidAt?: Date;
}

export interface PaymentCreate {
  payerId: number;
  rentAgreementId: number;
  amount: number;
  currency?: string;
  paymentType: string;
  paymentMethod?: string;
  paymentPeriodStart?: Date;
  paymentPeriodEnd?: Date;
  dueDate: Date;
  description?: string;
  notes?: string;
}

export interface PaymentUpdate {
  amount?: number;
  currency?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: PaymentStatus;
  paymentPeriodStart?: Date;
  paymentPeriodEnd?: Date;
  dueDate?: Date;
  description?: string;
  notes?: string;
  paidAt?: Date;
}

// X402 Payment interfaces
export interface X402PaymentRequest {
  amount: number;
  currency?: string;
  description: string;
  paymentReference: string;
}

export interface X402PaymentResponse {
  paymentId: string;
  paymentUrl: string;
  status: string;
  transactionHash?: string;
}

// Authentication interfaces
export interface Token {
  accessToken: string;
  tokenType: string;
}

export interface TokenData {
  username?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request interfaces
export interface AuthenticatedRequest extends Request {
  user?: User;
  isAuthorized?: boolean;
  privyId?: string;
}

// Service interfaces
export interface DatabaseService {
  user: UserService;
  property: PropertyService;
  rentAgreement: RentAgreementService;
  payment: PaymentService;
}

export interface UserService {
  create(data: UserCreate): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPrivyId(privyId: string): Promise<User | null>;
  update(id: number, data: UserUpdate): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

export interface PropertyService {
  create(data: PropertyCreate, ownerId: number): Promise<Property>;
  findById(id: number): Promise<Property | null>;
  findMany(search?: PropertySearch): Promise<Property[]>;
  update(id: number, data: PropertyUpdate): Promise<Property | null>;
  delete(id: number): Promise<boolean>;
}

export interface RentAgreementService {
  create(data: RentAgreementCreate): Promise<RentAgreement>;
  findById(id: number): Promise<RentAgreement | null>;
  findByPropertyId(propertyId: number): Promise<RentAgreement[]>;
  findByTenantId(tenantId: number): Promise<RentAgreement[]>;
  update(id: number, data: RentAgreementUpdate): Promise<RentAgreement | null>;
  delete(id: number): Promise<boolean>;
}

export interface PaymentService {
  create(data: PaymentCreate): Promise<Payment>;
  findById(id: number): Promise<Payment | null>;
  findByRentAgreementId(rentAgreementId: number): Promise<Payment[]>;
  findByPayerId(payerId: number): Promise<Payment[]>;
  update(id: number, data: PaymentUpdate): Promise<Payment | null>;
  delete(id: number): Promise<boolean>;
}
