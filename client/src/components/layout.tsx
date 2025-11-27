import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Bell, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import logoImage from "@assets/generated_images/abstract_tech_logo_with_blue_and_purple_gradients.png";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Equipe", href: "/team" },
    { icon: Bell, label: "Notificações", href: "/notifications" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-heading font-bold text-xl tracking-tight">
            <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-primary/20" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Nexus<span className="text-foreground">App</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-8 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-border hover:ring-primary transition-all">
                <Avatar className="h-full w-full">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@usuario" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">João Silva</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    joao.silva@exemplo.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "relative border-r border-border/40 bg-background/30 backdrop-blur-sm transition-all duration-300 ease-in-out flex flex-col",
            isCollapsed ? "w-[70px]" : "w-64"
          )}
        >
          {/* Toggle Button - Centered Vertically on the right edge */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-primary text-primary-foreground rounded-full p-1 shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors border border-background"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="flex-1 py-6 px-3 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )} />
                    {!isCollapsed && (
                      <span className="font-medium whitespace-nowrap overflow-hidden text-sm animate-in fade-in duration-300">
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="p-3 mt-auto">
            <div className={cn(
              "rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/10 p-4",
              isCollapsed ? "hidden" : "block"
            )}>
              <h4 className="font-semibold text-sm mb-1">Plano Pro</h4>
              <p className="text-xs text-muted-foreground mb-3">Acesso ilimitado a todas as ferramentas.</p>
              <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                Upgrade
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[100px]" />
          </div>
          
          <div className="max-w-6xl mx-auto animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
