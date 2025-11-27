import { eq, and, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";
import type { InsertUser, User, SelectUser, UpdateUser } from "@shared/schema";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<SelectUser>;
  
  // Users CRUD
  getUser(id: string): Promise<SelectUser | undefined>;
  getAllUsers(): Promise<SelectUser[]>;
  updateUser(id: string, data: UpdateUser): Promise<SelectUser | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateLastActive(id: string): Promise<void>;
  
  // Password Reset
  setResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(userId: string): Promise<void>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  
  // External ID validation
  isExternalIdUnique(externalId: string, excludeUserId?: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.db = drizzle(pool, { schema });
  }

  // Helper to exclude sensitive fields from results
  private excludePassword(user: User): SelectUser {
    const { password, resetToken, resetTokenExpiry, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<SelectUser> {
    const result = await this.db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    
    return this.excludePassword(result[0]);
  }

  async getUser(id: string): Promise<SelectUser | undefined> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    
    if (!result[0]) return undefined;
    return this.excludePassword(result[0]);
  }

  async getAllUsers(): Promise<SelectUser[]> {
    const results = await this.db
      .select()
      .from(schema.users);
    
    return results.map(user => this.excludePassword(user));
  }

  async updateUser(id: string, data: UpdateUser): Promise<SelectUser | undefined> {
    const result = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();
    
    if (!result[0]) return undefined;
    return this.excludePassword(result[0]);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();
    
    return result.length > 0;
  }

  async updateLastActive(id: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ lastActive: new Date() })
      .where(eq(schema.users.id, id));
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const result = await this.db
      .update(schema.users)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(schema.users.email, email))
      .returning();
    
    return result.length > 0;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.resetToken, token))
      .limit(1);
    
    return result[0];
  }

  async clearResetToken(userId: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(schema.users.id, userId));
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.id, userId));
  }

  async isExternalIdUnique(externalId: string, excludeUserId?: string): Promise<boolean> {
    if (!externalId || externalId.trim() === '') {
      return true;
    }
    
    const conditions = [eq(schema.users.externalId, externalId)];
    
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.externalId, externalId))
      .limit(1);
    
    if (result.length === 0) {
      return true;
    }
    
    if (excludeUserId && result[0].id === excludeUserId) {
      return true;
    }
    
    return false;
  }
}

export const storage = new DatabaseStorage();
