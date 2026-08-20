import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Server, Cpu, HardDrive, Network, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/server")({
  component: () => (
    <AppLayout>
      <ServerPage />
    </AppLayout>
  ),
});

function ServerPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Infraestrutura do Servidor</h1>
          <p className="text-slate-500 mt-1">Monitoramento de hardware e recursos da VPS Hostinger.</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold">
          <ShieldCheck className="w-3 h-3 mr-1" /> Protegido
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3">
              <div className="bg-blue-500 h-full w-[12.4%]" />
            </div>
            <p className="text-xs text-slate-400 mt-2">Intel(R) Xeon(R) Gold 6248R @ 3.00GHz</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">Memory usage</CardTitle>
            <HardDrive className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 GB / 8 GB</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3">
              <div className="bg-indigo-500 h-full w-[26%]" />
            </div>
            <p className="text-xs text-slate-400 mt-2">DDR4 ECC Registered</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase text-slate-500">Network traffic</CardTitle>
            <Network className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245 Kbps</div>
            <div className="flex gap-4 mt-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Inbound</span>
                <span className="text-xs font-semibold">180 Kbps</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Outbound</span>
                <span className="text-xs font-semibold">65 Kbps</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Server className="h-5 w-5 text-slate-900" />
          <h2 className="font-bold text-slate-900">Docker Containers</h2>
        </div>
        <div className="space-y-4">
          {[
            { name: "agilliza-worker", status: "Up 12 days", image: "agilliza/worker:latest", port: "-" },
            { name: "agilliza-web", status: "Up 12 days", image: "agilliza/web:latest", port: "80:8080" },
          ].map((container, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <div className="font-semibold text-sm text-slate-900">{container.name}</div>
                  <div className="text-xs text-slate-500">{container.image}</div>
                </div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="text-xs font-medium">{container.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ports</span>
                  <span className="text-xs font-medium">{container.port}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
