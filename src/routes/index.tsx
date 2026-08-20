import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    title: "Sistema Gerenciador de Email",
    meta: [
      {
        name: "description",
        content: "Um sistema completo para gerenciar seus envios de e-mail.",
      },
      {
        property: "og:title",
        content: "Sistema Gerenciador de Email",
      },
      {
        property: "og:description",
        content: "Um sistema completo para gerenciar seus envios de e-mail.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
});

function Index() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcfbf8] p-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">
        Sistema Gerenciador de Email
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        Seu backend Lovable Cloud foi conectado com sucesso.
      </p>

      {session ? (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-gray-700">Olá, {session.user.email}!</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      ) : (
        <div className="space-x-4">
          <a
            href="/auth"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            Entrar / Cadastrar
          </a>
        </div>
      )}
    </div>
  );
}
