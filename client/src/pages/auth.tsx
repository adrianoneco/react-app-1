import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import logoImage from "@assets/generated_images/abstract_tech_logo_with_blue_and_purple_gradients.png";

// Schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const recoverySchema = z.object({
  email: z.string().email("Email inválido"),
});

type AuthMode = "login" | "register" | "recovery";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
  });

  // Handlers
  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log("Login data:", data);
    setLocation("/");
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log("Register data:", data);
    setMode("login");
  };

  const onRecovery = async (data: z.infer<typeof recoverySchema>) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log("Recovery data:", data);
    // Show success message or switch back to login
    setMode("login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background p-4">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse duration-3000" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="Logo" 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-2xl shadow-primary/30"
          />
          <h1 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Nexus Platform
          </h1>
          <p className="text-muted-foreground mt-2">O futuro da gestão integrada</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <CardTitle>Bem-vindo de volta</CardTitle>
                  <CardDescription>Entre com suas credenciais para acessar</CardDescription>
                </CardHeader>
                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          placeholder="nome@empresa.com" 
                          className="pl-9 bg-secondary/50 border-border/50" 
                          {...loginForm.register("email")}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        <button 
                          type="button" 
                          onClick={() => setMode("recovery")}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          className="pl-9 bg-secondary/50 border-border/50"
                          {...loginForm.register("password")}
                        />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Não tem uma conta?{" "}
                      <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                        Cadastre-se
                      </button>
                    </div>
                  </CardFooter>
                </form>
              </motion.div>
            )}

            {mode === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <CardTitle>Criar conta</CardTitle>
                  <CardDescription>Comece sua jornada conosco hoje</CardDescription>
                </CardHeader>
                <form onSubmit={registerForm.handleSubmit(onRegister)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          placeholder="Seu nome" 
                          className="pl-9 bg-secondary/50 border-border/50" 
                          {...registerForm.register("name")}
                        />
                      </div>
                      {registerForm.formState.errors.name && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="reg-email" 
                          placeholder="nome@empresa.com" 
                          className="pl-9 bg-secondary/50 border-border/50" 
                          {...registerForm.register("email")}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-pass">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="reg-pass" 
                          type="password" 
                          className="pl-9 bg-secondary/50 border-border/50"
                          {...registerForm.register("password")}
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="confirm-pass" 
                          type="password" 
                          className="pl-9 bg-secondary/50 border-border/50"
                          {...registerForm.register("confirmPassword")}
                        />
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Já tem uma conta?{" "}
                      <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                        Fazer login
                      </button>
                    </div>
                  </CardFooter>
                </form>
              </motion.div>
            )}

            {mode === "recovery" && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader>
                  <button 
                    onClick={() => setMode("login")} 
                    className="w-fit mb-2 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <CardTitle>Recuperar Senha</CardTitle>
                  <CardDescription>Enviaremos um link de recuperação para seu email</CardDescription>
                </CardHeader>
                <form onSubmit={recoveryForm.handleSubmit(onRecovery)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rec-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="rec-email" 
                          placeholder="nome@empresa.com" 
                          className="pl-9 bg-secondary/50 border-border/50" 
                          {...recoveryForm.register("email")}
                        />
                      </div>
                      {recoveryForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{recoveryForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Link"}
                    </Button>
                  </CardFooter>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground/50">
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Privacidade</span>
          <span>•</span>
          <span>Ajuda</span>
        </div>
      </motion.div>
    </div>
  );
}
