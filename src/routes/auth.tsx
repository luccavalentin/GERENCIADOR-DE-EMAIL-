import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";


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
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <Card className="w-full max-w-md premium-card overflow-hidden">
        <CardHeader className="flex flex-col items-center pt-10 pb-6 bg-slate-50/50 border-b border-slate-100">
          <img src="/logo-agilliza.png" alt="Agilliza" className="mb-6 h-16 object-contain transition-transform hover:scale-105" />
          <CardTitle className="text-2xl font-bold text-slate-900">{isSignUp ? "Criar Conta" : "Painel de E-mail"}</CardTitle>
          <CardDescription className="text-center px-6 pt-2 text-slate-500 font-medium tracking-tight">
            {isSignUp
              ? "Cadastre-se para gerenciar seus e-mails com eficiência."
              : "Entre para acessar sua central operacional de e-mails."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nome Completo</label>
                <Input
                  type="text"
                  placeholder="Nome e Sobrenome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 border-slate-200 focus:border-agilliza focus:ring-agilliza/10 transition-all rounded-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">E-mail Corporativo</label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-slate-200 focus:border-agilliza focus:ring-agilliza/10 transition-all rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Senha de Acesso</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-200 focus:border-agilliza focus:ring-agilliza/10 transition-all rounded-lg"
              />
            </div>
            <Button className="w-full h-12 bg-agilliza hover:bg-blue-900 font-bold text-base shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] mt-2" type="submit" disabled={loading}>
              {loading ? "Processando..." : isSignUp ? "Cadastrar Agora" : "Acessar Sistema"}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-agilliza font-bold text-sm hover:underline hover:text-blue-900 transition-colors"
            >
              {isSignUp
                ? "Já tem uma conta? Clique para entrar"
                : "Ainda não tem acesso? Cadastre-se"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}