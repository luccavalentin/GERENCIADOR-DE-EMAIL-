import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoWhite from "@/assets/logo-white.png.asset.json";
import logoPrimary from "@/assets/logo-primary.png.asset.json";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate({ to: "/" });
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        toast.success("Verifique seu e-mail para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/" });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#fcfbf8]">
      {/* Lado Esquerdo - Visual (Oculto em Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
        {/* Pattern de fundo sutil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white/20" />
          <div className="grid grid-cols-8 gap-4 rotate-12 scale-150">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="h-20 w-20 border border-white/10 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <img src={logoWhite.url} alt="Agilliza" className="mb-12 h-20 object-contain" />
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Gestão inteligente de e-mails para o seu negócio.
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Monitore palavras-chave, encaminhe mensagens automaticamente e tenha total controle sobre o fluxo de informação da sua empresa.
          </p>
          
          <div className="space-y-4">
            {[
              "Monitoramento em Tempo Real",
              "Encaminhamento Inteligente",
              "Logs Detalhados e Histórico",
              "Segurança Multitenancy"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-blue-300" />
                <span className="text-lg font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 text-blue-200 text-sm">
          © {new Date().getFullYear()} Agilliza Crédito Imobiliário. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 animate-in fade-in slide-in-from-right-8 duration-700">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoPrimary.url} alt="Agilliza" className="h-16 object-contain" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {isSignUp ? "Criar sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-gray-500">
              {isSignUp 
                ? "Preencha os dados abaixo para começar." 
                : "Entre com seus dados de acesso."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2 group">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10 h-11 border-gray-200 focus:ring-primary focus:border-primary"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 group">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com"
                  className="pl-10 h-11 border-gray-200 focus:ring-primary focus:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-medium text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 border-gray-200 focus:ring-primary focus:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] gap-2" type="submit" disabled={loading}>
              {loading ? (
                "Processando..."
              ) : (
                <>
                  {isSignUp ? "Criar conta" : "Entrar no sistema"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-primary hover:underline transition-colors"
              >
                {isSignUp ? "Entre agora" : "Cadastre-se grátis"}
              </button>
            </p>
          </div>

          <div className="pt-8 text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Segurança Criptografada ponta a ponta
          </div>
        </div>
      </div>
    </div>
  );
}