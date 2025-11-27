import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { socket } from "@/lib/socket";
import { useEffect } from "react";

export default function Dashboard() {
  useEffect(() => {
    // Example socket usage - just listening for mockup events
    socket.emit("dashboard:view");
  }, []);

  const stats = [
    {
      title: "Receita Total",
      value: "R$ 45.231,89",
      change: "+20.1% este mês",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Assinaturas",
      value: "+2350",
      change: "+180.1% este mês",
      icon: Users,
      trend: "up"
    },
    {
      title: "Vendas",
      value: "+12,234",
      change: "+19% este mês",
      icon: CreditCard,
      trend: "up"
    },
    {
      title: "Ativos Agora",
      value: "+573",
      change: "+201 na última hora",
      icon: Activity,
      trend: "up"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral do sistema e métricas principais.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-muted-foreground font-mono">Sistema Online</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-card/40 border-border/50 backdrop-blur-sm hover:bg-card/60 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                  <span className="text-emerald-500 font-medium">{stat.change.split(' ')[0]}</span>
                  <span className="opacity-70">{stat.change.split(' ').slice(1).join(' ')}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 bg-card/40 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {/* Mock Chart Placeholder */}
              <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4 pb-2 pt-8">
                {[40, 25, 60, 35, 85, 55, 70, 45, 90, 65, 30, 80].map((h, i) => (
                  <div key={i} className="relative w-full bg-primary/10 rounded-t-md overflow-hidden group h-full flex items-end">
                    <div 
                      className="w-full bg-gradient-to-t from-primary/50 to-primary rounded-t-md transition-all duration-500 ease-out group-hover:brightness-110"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-4 mt-2 text-xs text-muted-foreground font-mono">
                <span>JAN</span>
                <span>FEV</span>
                <span>MAR</span>
                <span>ABR</span>
                <span>MAI</span>
                <span>JUN</span>
                <span>JUL</span>
                <span>AGO</span>
                <span>SET</span>
                <span>OUT</span>
                <span>NOV</span>
                <span>DEZ</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 bg-card/40 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { user: "Maria Costa", action: "Nova compra", amount: "+R$ 250,00", time: "2 min atrás" },
                  { user: "João Silva", action: "Novo assinante", amount: "+R$ 49,00", time: "5 min atrás" },
                  { user: "Pedro Santos", action: "Reembolso", amount: "-R$ 29,00", time: "12 min atrás", type: "negative" },
                  { user: "Ana Oliveira", action: "Nova compra", amount: "+R$ 120,00", time: "25 min atrás" },
                  { user: "Lucas Lima", action: "Novo assinante", amount: "+R$ 49,00", time: "32 min atrás" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/30 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary">
                        {item.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-none">{item.user}</p>
                        <p className="text-xs text-muted-foreground">{item.action}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-sm font-bold ${item.type === 'negative' ? 'text-destructive' : 'text-foreground'}`}>
                        {item.amount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
