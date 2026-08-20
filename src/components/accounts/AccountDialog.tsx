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
  Tags,
  History as HistoryIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  email_password: z.string().optional(),
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
          emailPassword: values.email_password || "",
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
            <Tabs defaultValue="geral" className="flex-1 overflow-hidden flex flex-col">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-6">
                  <TabsTrigger value="geral" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000A0] data-[state=active]:bg-transparent px-0 h-12 font-bold text-slate-500 data-[state=active]:text-[#0000A0]">CONTA PRINCIPAL</TabsTrigger>
                  <TabsTrigger value="entrada" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000A0] data-[state=active]:bg-transparent px-0 h-12 font-bold text-slate-500 data-[state=active]:text-[#0000A0]">SERVIDORES</TabsTrigger>
                  <TabsTrigger value="destinatarios" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000A0] data-[state=active]:bg-transparent px-0 h-12 font-bold text-slate-500 data-[state=active]:text-[#0000A0]">DESTINATÁRIOS</TabsTrigger>
                  <TabsTrigger value="regras" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0000A0] data-[state=active]:bg-transparent px-0 h-12 font-bold text-slate-500 data-[state=active]:text-[#0000A0]">REGRAS</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <TabsContent value="geral" className="mt-0 space-y-6">
                    <Card className="premium-card bg-slate-50/50 shadow-none">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Globe className="h-4 w-4 text-[#0000A0]" />
                          Informações Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email_user"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail da Conta</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <Input placeholder="exemplo@agilliza.net.br" className="pl-10 bg-white" {...field} />
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
                                  <Input type="password" placeholder="••••••••" className="pl-10 bg-white" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>Senha de aplicativo ou acesso direto.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="entrada" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="premium-card shadow-none">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0000A0]">
                            <HistoryIcon className="h-4 w-4" />
                            IMAP (Entrada)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="imap_host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Host</FormLabel>
                                <Input {...field} />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
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
                            <FormField
                              control={form.control}
                              name="imap_secure"
                              render={({ field }) => (
                                <FormItem className="flex flex-col justify-end pb-2">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    <FormLabel className="cursor-pointer">SSL/TLS</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="premium-card shadow-none">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0000A0]">
                            <Mail className="h-4 w-4" />
                            SMTP (Saída)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="smtp_host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Host</FormLabel>
                                <Input {...field} />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
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
                            <FormField
                              control={form.control}
                              name="smtp_secure"
                              render={({ field }) => (
                                <FormItem className="flex flex-col justify-end pb-2">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    <FormLabel className="cursor-pointer">SSL/TLS</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="destinatarios" className="mt-0 space-y-6">
                    <Card className="shadow-none border-slate-100">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">E-mails de Recebimento</CardTitle>
                        <CardDescription>Para onde os e-mails filtrados serão encaminhados.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Adicionar e-mail de destino..." 
                            value={destinationInput}
                            onChange={e => setDestinationInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                          />
                          <Button type="button" onClick={addDestination} variant="secondary">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          {form.watch("destinations").map((email) => (
                            <Badge key={email} variant="outline" className="pl-3 pr-1 py-1 gap-2 bg-white border-blue-200 text-blue-700 font-medium">
                              {email}
                              <button type="button" onClick={() => removeDestination(email)} className="hover:text-red-500 p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="regras" className="mt-0 space-y-6">
                    <Card className="shadow-none border-slate-100">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Tags className="h-4 w-4 text-[#0000A0]" />
                          Palavras-chave
                        </CardTitle>
                        <CardDescription className="text-[11px]">O sistema identifica automaticamente variações de maiúsculas, minúsculas e acentuação.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="codigo; token; senha" 
                            value={keywordInput}
                            onChange={e => setKeywordInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeywords())}
                          />
                          <Button type="button" onClick={addKeywords} variant="secondary">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          {form.watch("keywords").map((kw) => (
                            <Badge key={kw} className="pl-3 pr-1 py-1 gap-2 bg-[#0000A0] text-white hover:bg-[#0000A0] font-bold rounded-md border-none shadow-sm">
                              {kw}
                              <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-200 p-0.5 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="p-6 bg-slate-50 border-t gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-bold border-slate-200">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#0000A0] hover:bg-[#000080] shadow-md font-bold px-8" 
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando..." : config ? "Salvar Alterações" : "Criar Conta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  );
}
