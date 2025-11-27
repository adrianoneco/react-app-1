import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Lock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import logoImage from "@assets/generated_images/abstract_tech_logo_with_blue_and_purple_gradients.png";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const resetSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    setToken(tokenParam);

    if (tokenParam) {
      validateToken(tokenParam);
    } else {
      setIsValidating(false);
      setIsValid(false);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`/api/auth/validate-token/${tokenToValidate}`);
      const data = await response.json();
      setIsValid(data.valid);
    } catch (error) {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao redefinir senha");
      }

      setIsSuccess(true);
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso. Faça login com a nova senha.",
      });

      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background p-4">
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
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-6 pb-4 flex flex-col items-center gap-2 border-b border-border/10 bg-card/30 text-center">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-16 h-16 rounded-xl shadow-lg shadow-primary/20 mb-2"
            />
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-none">
                Nexus Platform
              </h1>
              <p className="text-sm text-muted-foreground mt-1">O futuro da gestão integrada</p>
            </div>
          </div>

          {isValidating ? (
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validando link...</p>
            </CardContent>
          ) : !isValid ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Link Inválido</CardTitle>
                <CardDescription>
                  Este link de recuperação é inválido ou expirou. Solicite um novo link.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/auth")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Login
                </Button>
              </CardFooter>
            </>
          ) : isSuccess ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle>Senha Redefinida</CardTitle>
                <CardDescription>
                  Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/auth")}
                >
                  Ir para Login
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Redefinir Senha</CardTitle>
                <CardDescription>Digite sua nova senha abaixo</CardDescription>
              </CardHeader>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <PasswordInput
                        id="password"
                        placeholder="••••••••"
                        className="pl-9 bg-secondary/50 border-border/50"
                        {...form.register("password")}
                      />
                    </div>
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <PasswordInput
                        id="confirmPassword"
                        placeholder="••••••••"
                        className="pl-9 bg-secondary/50 border-border/50"
                        {...form.register("confirmPassword")}
                      />
                    </div>
                    {form.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir Senha"}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
