import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowLeft, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import logoImage from "@assets/generated_images/abstract_tech_logo_with_blue_and_purple_gradients.png";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

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
type RecoveryStep = "email" | "methods" | "sent";

interface RecoveryMethods {
  email: boolean;
  whatsapp: boolean;
}

interface AuthPageProps {
  mode?: AuthMode;
}

export default function AuthPage({ mode: initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("email");
  const [recoveryMethods, setRecoveryMethods] = useState<RecoveryMethods | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"email" | "whatsapp">("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isCheckingMethods, setIsCheckingMethods] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetRecoveryState = () => {
    setRecoveryStep("email");
    setRecoveryMethods(null);
    setSelectedMethod("email");
    setRecoveryEmail("");
    recoveryForm.reset();
  };

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.email, data.password);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      // Transform name to proper case and email to lowercase before sending
      const formattedName = data.name.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      const formattedEmail = data.email.toLowerCase();
      
      await register(formattedEmail, formattedName, data.password);
      toast({
        title: "Conta criada com sucesso",
        description: "Sua conta foi criada e você já está logado.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível criar sua conta.",
      });
    }
  };

  const onCheckRecoveryMethods = async (data: z.infer<typeof recoverySchema>) => {
    setIsCheckingMethods(true);
    try {
      const response = await fetch("/api/auth/recovery/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao verificar métodos de recuperação");
      }

      setRecoveryEmail(data.email);
      setRecoveryMethods(result.methods);
      
      if (!result.methods.email && !result.methods.whatsapp) {
        toast({
          variant: "destructive",
          title: "Nenhum método disponível",
          description: result.message || "Não foi possível encontrar métodos de recuperação para este email.",
        });
        return;
      }

      if (result.methods.email && !result.methods.whatsapp) {
        setSelectedMethod("email");
      } else if (result.methods.whatsapp && !result.methods.email) {
        setSelectedMethod("whatsapp");
      }

      setRecoveryStep("methods");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível verificar os métodos de recuperação.",
      });
    } finally {
      setIsCheckingMethods(false);
    }
  };

  const onSendRecovery = async () => {
    setIsSendingRecovery(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: recoveryEmail,
          method: selectedMethod 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar solicitação");
      }

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Erro ao enviar",
          description: result.message || "Não foi possível enviar a recuperação.",
        });
        return;
      }

      setRecoveryStep("sent");
      toast({
        title: "Enviado com sucesso",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível processar a solicitação.",
      });
    } finally {
      setIsSendingRecovery(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background p-4">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
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
        <Card className="border-border/50 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-6 pb-4 flex items-center justify-center gap-4 border-b border-border/20 bg-card">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-16 h-16 rounded-xl shadow-lg shadow-primary/20 flex-shrink-0"
            />
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-heading font-bold text-foreground leading-none">
                Nexus Platform
              </h1>
              <p className="text-sm text-muted-foreground mt-1">O futuro da gestão integrada</p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader className="text-center">
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
                          onClick={() => setLocation("/auth/recovery")}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                        <PasswordInput
                          id="password"
                          placeholder="••••••••"
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
                      <button type="button" onClick={() => setLocation("/auth/register")} className="text-primary hover:underline font-medium">
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
                <CardHeader className="text-center">
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
                          className="pl-9 bg-secondary/50 border-border/50 uppercase" 
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
                          className="pl-9 bg-secondary/50 border-border/50 lowercase" 
                          {...registerForm.register("email")}
                        />
                      </div>
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-pass">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <PasswordInput
                            id="reg-pass"
                            placeholder="••••••••"
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
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                          <PasswordInput
                            id="confirm-pass"
                            placeholder="••••••••"
                            className="pl-9 bg-secondary/50 border-border/50"
                            {...registerForm.register("confirmPassword")}
                          />
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Já tem uma conta?{" "}
                      <button type="button" onClick={() => setLocation("/auth/login")} className="text-primary hover:underline font-medium">
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
                <AnimatePresence mode="wait">
                  {recoveryStep === "email" && (
                    <motion.div
                      key="recovery-email"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardHeader className="text-center">
                        <CardTitle>Recuperar Senha</CardTitle>
                        <CardDescription>Digite seu email para verificar as opções de recuperação</CardDescription>
                      </CardHeader>
                      <form onSubmit={recoveryForm.handleSubmit(onCheckRecoveryMethods)}>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="rec-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                id="rec-email" 
                                placeholder="nome@empresa.com" 
                                className="pl-9 bg-secondary/50 border-border/50" 
                                data-testid="input-recovery-email"
                                {...recoveryForm.register("email")}
                              />
                            </div>
                            {recoveryForm.formState.errors.email && (
                              <p className="text-xs text-destructive">{recoveryForm.formState.errors.email.message}</p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                          <Button 
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                            disabled={isCheckingMethods}
                            data-testid="button-check-methods"
                          >
                            {isCheckingMethods ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
                          </Button>
                          <div className="flex justify-between items-center text-sm w-full">
                            <button type="button" onClick={() => setLocation("/auth/login")} className="text-primary hover:underline font-medium">
                              Voltar para login
                            </button>
                            <button type="button" onClick={() => setLocation("/auth/register")} className="text-primary hover:underline font-medium">
                              Criar conta
                            </button>
                          </div>
                        </CardFooter>
                      </form>
                    </motion.div>
                  )}

                  {recoveryStep === "methods" && recoveryMethods && (
                    <motion.div
                      key="recovery-methods"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardHeader className="text-center">
                        <CardTitle>Escolha o Método</CardTitle>
                        <CardDescription>Selecione como deseja receber o link de recuperação</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <RadioGroup 
                          value={selectedMethod} 
                          onValueChange={(value) => setSelectedMethod(value as "email" | "whatsapp")}
                          className="space-y-3"
                        >
                          {recoveryMethods.email && (
                            <div 
                              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                                selectedMethod === "email" 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border/50 bg-secondary/30"
                              }`}
                              onClick={() => setSelectedMethod("email")}
                              data-testid="option-email"
                            >
                              <RadioGroupItem value="email" id="method-email" />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <Label htmlFor="method-email" className="font-medium cursor-pointer">
                                    Email
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    Receber link por email
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {recoveryMethods.whatsapp && (
                            <div 
                              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                                selectedMethod === "whatsapp" 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border/50 bg-secondary/30"
                              }`}
                              onClick={() => setSelectedMethod("whatsapp")}
                              data-testid="option-whatsapp"
                            >
                              <RadioGroupItem value="whatsapp" id="method-whatsapp" />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 rounded-full bg-emerald-500/10">
                                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                  <Label htmlFor="method-whatsapp" className="font-medium cursor-pointer">
                                    WhatsApp
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    Receber link via WhatsApp
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </RadioGroup>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={onSendRecovery}
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                          disabled={isSendingRecovery}
                          data-testid="button-send-recovery"
                        >
                          {isSendingRecovery ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Link"}
                        </Button>
                      </CardFooter>
                    </motion.div>
                  )}

                  {recoveryStep === "sent" && (
                    <motion.div
                      key="recovery-sent"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardHeader className="text-center">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-emerald-500/10">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <CardTitle>Link Enviado</CardTitle>
                        <CardDescription>
                          {selectedMethod === "whatsapp" 
                            ? "Verifique seu WhatsApp para o link de recuperação."
                            : "Verifique seu email para o link de recuperação."
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button 
                          onClick={() => { setLocation("/auth/login"); resetRecoveryState(); }}
                          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                          data-testid="button-back-to-login"
                        >
                          Voltar para Login
                        </Button>
                      </CardFooter>
                    </motion.div>
                  )}
                </AnimatePresence>
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
