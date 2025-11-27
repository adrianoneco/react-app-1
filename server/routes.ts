import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcrypt";
import crypto from "crypto";
import path from "path";
import { insertUserSchema, loginSchema, updateUserSchema, resetPasswordSchema, newPasswordSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { sendPasswordResetEmail, isEmailConfigured } from "./email";
import { uploadAvatar, processAndSaveAvatar, deleteAvatarFile, getAvatarPath, AVATARS_DIR } from "./upload";
import express from "express";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "nexus-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    next();
  };

  // ============ AUTH ROUTES ============

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;

      res.json({ user });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Erro ao cadastrar usuário" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Update last active
      await storage.updateLastActive(user.id);

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Password Reset - Request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      
      res.json({ 
        success: true, 
        message: "Se o email existir, você receberá instruções de recuperação." 
      });
      
      if (!user) {
        return;
      }

      if (!isEmailConfigured()) {
        console.warn("SMTP not configured. Password reset email not sent.");
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.setResetToken(data.email, token, expiry);
      await sendPasswordResetEmail(data.email, token, user.name);
      
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  // Password Reset - Set New Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const data = newPasswordSchema.parse(req.body);
      
      if (!data.token || data.token.length !== 64) {
        return res.status(400).json({ error: "Token inválido" });
      }
      
      const user = await storage.getUserByResetToken(data.token);
      if (!user) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      if (!user.resetToken || user.resetToken !== data.token) {
        return res.status(400).json({ error: "Token inválido" });
      }

      if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        await storage.clearResetToken(user.id);
        return res.status(400).json({ error: "Token expirado" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      await storage.updatePassword(user.id, hashedPassword);
      await storage.clearResetToken(user.id);

      res.json({ success: true, message: "Senha redefinida com sucesso" });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  // Validate reset token
  app.get("/api/auth/validate-token/:token", async (req, res) => {
    try {
      const token = req.params.token;
      if (!token || token.length !== 64) {
        return res.json({ valid: false });
      }
      
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.json({ valid: false });
      }
      
      if (!user.resetToken || user.resetToken !== token) {
        return res.json({ valid: false });
      }
      
      if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        await storage.clearResetToken(user.id);
        return res.json({ valid: false });
      }
      
      res.json({ valid: true });
    } catch (error) {
      console.error("Validate token error:", error);
      res.json({ valid: false });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // ============ USERS ROUTES ============

  // Get all users (protected)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  // Get user by ID (protected)
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // Create user (protected)
  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Check if external_id is unique
      if (data.externalId) {
        const isUnique = await storage.isExternalIdUnique(data.externalId);
        if (!isUnique) {
          return res.status(400).json({ error: "ID externo já está em uso" });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      res.status(201).json({ user });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Create user error:", error);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  // Update user (protected)
  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      
      // Check if external_id is unique (excluding current user)
      if (data.externalId) {
        const isUnique = await storage.isExternalIdUnique(data.externalId, req.params.id);
        if (!isUnique) {
          return res.status(400).json({ error: "ID externo já está em uso" });
        }
      }
      
      const user = await storage.updateUser(req.params.id, data);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ user });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Update user error:", error);
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  // Delete user (protected)
  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (user?.avatar) {
        deleteAvatarFile(user.avatar);
      }
      
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  });

  // ============ AVATAR ROUTES ============

  // Serve avatars
  app.use("/api/avatars", express.static(AVATARS_DIR));

  // Upload avatar (protected)
  app.post("/api/users/:id/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (user.avatar) {
        deleteAvatarFile(user.avatar);
      }

      const avatarUrl = await processAndSaveAvatar(req.file, req.params.id);
      
      const updatedUser = await storage.updateUser(req.params.id, { avatar: avatarUrl });

      res.json({ user: updatedUser, avatar: avatarUrl });
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      res.status(500).json({ error: error.message || "Erro ao fazer upload do avatar" });
    }
  });

  // Delete avatar (protected)
  app.delete("/api/users/:id/avatar", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (user.avatar) {
        deleteAvatarFile(user.avatar);
      }

      const updatedUser = await storage.updateUser(req.params.id, { avatar: null });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Delete avatar error:", error);
      res.status(500).json({ error: "Erro ao remover avatar" });
    }
  });

  return httpServer;
}
