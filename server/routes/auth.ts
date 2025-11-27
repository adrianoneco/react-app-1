import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema, loginSchema, resetPasswordSchema, newPasswordSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { 
  sendPasswordResetEmail, 
  sendPasswordResetWhatsApp, 
  isEmailConfigured, 
  isWhatsAppConfigured 
} from "../email";
import { 
  hashPassword, 
  comparePassword, 
  generateResetToken, 
  getTokenExpiry, 
  isTokenExpired, 
  isValidToken 
} from "../utils/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const data = insertUserSchema.parse(req.body);
    
    const existing = await storage.getUserByEmail(data.email);
    if (existing) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await storage.createUser({
      ...data,
      password: hashedPassword,
    });

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

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    const validPassword = await comparePassword(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    await storage.updateLastActive(user.id);

    req.session.userId = user.id;

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

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao fazer logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/recovery-methods", async (req, res) => {
  try {
    const methods = {
      email: isEmailConfigured(),
      whatsapp: isWhatsAppConfigured(),
    };
    res.json({ methods });
  } catch (error) {
    console.error("Get recovery methods error:", error);
    res.status(500).json({ error: "Erro ao buscar métodos de recuperação" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const method = req.body.method || "email";
    
    const user = await storage.getUserByEmail(data.email);
    
    res.json({ 
      success: true, 
      message: method === "whatsapp" 
        ? "Se o número estiver cadastrado, você receberá instruções via WhatsApp."
        : "Se o email existir, você receberá instruções de recuperação." 
    });
    
    if (!user) {
      return;
    }

    const token = generateResetToken();
    const expiry = getTokenExpiry(1);
    
    await storage.setResetToken(data.email, token, expiry);

    if (method === "whatsapp") {
      if (!isWhatsAppConfigured()) {
        console.warn("WhatsApp endpoint not configured. Password reset not sent.");
        return;
      }
      
      if (!user.celular) {
        console.warn("User does not have a phone number. WhatsApp reset not sent.");
        return;
      }
      
      await sendPasswordResetWhatsApp(user.celular, token, user.name);
    } else {
      if (!isEmailConfigured()) {
        console.warn("SMTP not configured. Password reset email not sent.");
        return;
      }
      
      await sendPasswordResetEmail(data.email, token, user.name);
    }
    
  } catch (error: any) {
    if (error.name === "ZodError") {
      const validationError = fromError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const data = newPasswordSchema.parse(req.body);
    
    if (!isValidToken(data.token)) {
      return res.status(400).json({ error: "Token inválido" });
    }
    
    const user = await storage.getUserByResetToken(data.token);
    if (!user) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    if (!user.resetToken || user.resetToken !== data.token) {
      return res.status(400).json({ error: "Token inválido" });
    }

    if (isTokenExpired(user.resetTokenExpiry)) {
      await storage.clearResetToken(user.id);
      return res.status(400).json({ error: "Token expirado" });
    }

    const hashedPassword = await hashPassword(data.password);
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

router.get("/validate-token/:token", async (req, res) => {
  try {
    const token = req.params.token;
    if (!isValidToken(token)) {
      return res.json({ valid: false });
    }
    
    const user = await storage.getUserByResetToken(token);
    
    if (!user) {
      return res.json({ valid: false });
    }
    
    if (!user.resetToken || user.resetToken !== token) {
      return res.json({ valid: false });
    }
    
    if (isTokenExpired(user.resetTokenExpiry)) {
      await storage.clearResetToken(user.id);
      return res.json({ valid: false });
    }
    
    res.json({ valid: true });
  } catch (error) {
    console.error("Validate token error:", error);
    res.json({ valid: false });
  }
});

router.get("/me", async (req, res) => {
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

export default router;
