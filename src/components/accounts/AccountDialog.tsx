import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  X, 
  Plus, 
  Mail, 
  Lock, 
  Globe, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveEmailConfiguration } from "@/lib/email.functions";
import { supabase } from "@/integrations/supabase/client";

const accountSchema = z.object({
  email_user: z.string().email("E-mail inválido"),
  email_password: z.string().min(1, "Senha é obrigatória"),
  imap_host: z.string().min(1, "IMAP host é obrigatório"),
  imap_port: z.number().int().positive(),
  imap_secure: z.boolean(),
  smtp_host: z.string().min(1, "SMTP host é obrigatório"),
  smtp_port: z.number().int().positive(),
  smtp_secure: z.boolean(),
  destinations: z.array(z.string().email("E-mail de destino inválido")),
  keywords: z.array(z.string().min(1)),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: any; // For editing
}

export function AccountDialog({ open, onOpenChange, config }: AccountDialogProps) {
  const queryClient = useQueryClient();
  const [destinationInput, setDestinationInput] = React.useState("");
  const [keywordInput, setKeywordInput] = React.useState("");

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email_user: config?.email_user || "",
      email_password: "", // Never pre-fill password for security
      imap_host: config?.imap_host || "imap.uhserver.com",
      imap_port: config?.imap_port || 993,
      imap_secure: config?.imap_secure ?? true,
      smtp_host: config?.smtp_host || "smtp.uhserver.com",
      smtp_port: config?.smtp_port || 465,
      smtp_secure: config?.smtp_secure ?? true,
      destinations: config?.destinations || [],
      keywords: config?.keywords || ["codigo"],
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      return saveEmailConfiguration({
        data: {
          configId: config?.id,
          configData: {
            user_id: user.id,
            email_user: values.email_user,
            imap_host: values.imap_host,
            imap_port: values.imap_port,
            imap_secure: values.imap_secure,
            smtp_host: values.smtp_host,
            smtp_port: values.smtp_port,
            smtp_secure: values.smtp_secure,
            destinations: values.destinations,
            keywords: values.keywords,
            provider: "custom",
          },
          emailPassword: values.email_password,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeConfigs"] });
      toast.success(config ? "Conta atualizada" : "Conta criada com sucesso");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const addDestination = () => {
    const val = destinationInput.trim().toLowerCase();
    if (!val) return;
    if (!val.includes("@")) {
      toast.error("E-mail inválido");
      return;
    }
    const current = form.getValues("destinations");
    if (current.includes(val)) return;
    form.setValue("destinations", [...current, val]);
    setDestinationInput("");
  };

  const removeDestination = (email: string) => {
    const current = form.getValues("destinations");
    form.setValue("destinations", current.filter(d => d !== email));
  };

  const addKeywords = () => {
    // Split by comma, semicolon or newline
    const vals = keywordInput.split(/[;,\n]/).map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
    if (vals.length === 0) return;
    
    const current = form.getValues("keywords");
    const newKeywords = [...new Set([...current, ...vals])];
    form.setValue("keywords", newKeywords);
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    const current = form.getValues("keywords");
    form.setValue("keywords", current.filter(k => k !== kw));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-[#0000A0]">
            {config ? "Editar Conta de E-mail" : "Nova Conta de E-mail"}
          </DialogTitle>
          <DialogDescription>
            Configure a conta principal de monitoramento e seus destinatários.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6">
              <div className="py-4 space-y-8">
                {/* Section 1: E-MAIL DE SAÍDA / CONTA PRINCIPAL */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0000A0]">
                    <Shield className="h-5 w-5" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">E-mail de Saída / Conta Principal</h3>
                  </div>
                  <Separator className="bg-blue-100" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email_user"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail da Conta</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input placeholder="exemplo@agilliza.net.br" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha / App Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>Senha de aplicativo ou acesso direto.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Tabs defaultValue="imap" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                      <TabsTrigger value="imap" className="data-[state=active]:bg-white data-[state=active]:text-[#0000A0]">IMAP (Entrada)</TabsTrigger>
                      <TabsTrigger value="smtp" className="data-[state=active]:bg-white data-[state=active]:text-[#0000A0]">SMTP (Saída)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="imap" className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name="imap_host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Host IMAP</FormLabel>
                                <Input {...field} />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="imap_port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Porta</FormLabel>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="imap_secure"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Conexão Segura (SSL/TLS)</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="smtp" className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name="smtp_host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Host SMTP</FormLabel>
                                <Input {...field} />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="smtp_port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Porta</FormLabel>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="smtp_secure"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Conexão Segura (SSL/TLS)</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Section 2: E-MAILS DE RECEBIMENTO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0000A0]">
                    <Mail className="h-5 w-5" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">E-mails de Recebimento</h3>
                  </div>
                  <Separator className="bg-blue-100" />
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Adicionar e-mail de destino..." 
                          value={destinationInput}
                          onChange={e => setDestinationInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                        />
                      </div>
                      <Button type="button" onClick={addDestination} variant="secondary" className="bg-slate-100 hover:bg-slate-200">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                      {form.watch("destinations").map((email) => (
                        <Badge key={email} variant="outline" className="pl-3 pr-1 py-1 gap-2 bg-white border-blue-200 text-blue-700 font-medium">
                          {email}
                          <button 
                            type="button"
                            onClick={() => removeDestination(email)}
                            className="hover:bg-red-50 hover:text-red-500 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {form.watch("destinations").length === 0 && (
                        <span className="text-xs text-slate-400 italic flex items-center gap-2 py-1">
                          <AlertCircle className="h-3 w-3" />
                          Nenhum destinatário configurado.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: PALAVRAS-CHAVE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#0000A0]">
                    <Tags className="h-5 w-5" />
                    <h3 className="font-bold uppercase tracking-wider text-sm">Palavras-chave de Filtro</h3>
                  </div>
                  <Separator className="bg-blue-100" />
                  
                  <div className="space-y-4">
                    <FormDescription>
                      Insira termos como "codigo", "token" ou "senha". O sistema normaliza automaticamente.
                    </FormDescription>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="codigo; token; senha" 
                          value={keywordInput}
                          onChange={e => setKeywordInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeywords())}
                        />
                      </div>
                      <Button type="button" onClick={addKeywords} variant="secondary" className="bg-slate-100 hover:bg-slate-200">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                      {form.watch("keywords").map((kw) => (
                        <Badge key={kw} className="pl-3 pr-1 py-1 gap-2 bg-[#0000A0] text-white hover:bg-[#0000A0]">
                          {kw}
                          <button 
                            type="button"
                            onClick={() => removeKeyword(kw)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-slate-50/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#0000A0] hover:bg-[#000080] font-bold px-8 shadow-md"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando..." : (config ? "Salvar Alterações" : "Criar Conta")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
