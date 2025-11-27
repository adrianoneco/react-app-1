import { eq } from "drizzle-orm";
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
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.db = drizzle(pool, { schema });
  }

  // Helper to exclude password from results
  private excludePassword(user: User): SelectUser {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
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
}

export const storage = new DatabaseStorage();
