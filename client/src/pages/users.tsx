import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  Trash2, 
  Upload,
  UserPlus,
  Loader2,
  Camera,
  X,
  Phone,
  Users,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "@/components/ui/password-input";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataList, type Column, type DataListAction, type FilterOption } from "@/components/ui/data-list";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function PageHeader({ icon: Icon, title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-heading font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

interface User {
  id: string;
  name: string;
  email: string;
  celular?: string;
  externalId?: string;
  role: "admin" | "client";
  status: "active" | "inactive";
  avatar?: string;
  lastActive?: Date;
}

const userSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  celular: z.string().optional(),
  externalId: z.string().optional(),
  role: z.enum(["admin", "client"]),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal('')),
});

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "client">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      celular: "",
      externalId: "",
      role: "client",
      password: ""
    }
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar usuários");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Fetch users error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      if (editingUser) {
        form.reset({
          name: editingUser.name,
          email: editingUser.email,
          celular: editingUser.celular || "",
          externalId: editingUser.externalId || "",
          role: editingUser.role,
          password: ""
        });
        setPreviewAvatar(editingUser.avatar || null);
      } else {
        form.reset({
          name: "",
          email: "",
          celular: "",
          externalId: "",
          role: "client",
          password: ""
        });
        setPreviewAvatar(null);
      }
      setSelectedFile(null);
    }
  }, [isDialogOpen, editingUser, form]);

  const filteredUsers = users.filter(user => {
    return roleFilter === "all" || user.role === roleFilter;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao fazer upload do avatar");
    }

    return await response.json();
  };

  const deleteAvatar = async (userId: string) => {
    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao remover avatar");
    }
  };

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    try {
      let userId = editingUser?.id;

      if (editingUser) {
        const updatePayload = {
          name: data.name,
          email: data.email,
          celular: data.celular || null,
          externalId: data.externalId || null,
          role: data.role,
        };

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao atualizar usuário");
        }

        if (!previewAvatar && editingUser.avatar) {
          await deleteAvatar(editingUser.id);
        }

        toast({
          title: "Usuário atualizado",
          description: `O usuário ${data.name} foi atualizado com sucesso.`
        });
      } else {
        if (!data.password) {
          throw new Error("Senha é obrigatória para novos usuários");
        }

        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            celular: data.celular || null,
            externalId: data.externalId || null,
            role: data.role,
            password: data.password,
            status: "active",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar usuário");
        }

        const result = await response.json();
        userId = result.user.id;

        toast({
          title: "Usuário criado",
          description: `O usuário ${data.name} foi criado com sucesso.`
        });
      }

      if (selectedFile && userId) {
        setIsUploadingAvatar(true);
        try {
          await uploadAvatar(userId, selectedFile);
        } catch (uploadError: any) {
          toast({
            variant: "destructive",
            title: "Aviso",
            description: `Usuário salvo, mas houve um erro ao enviar a foto: ${uploadError.message}`,
          });
        }
        setIsUploadingAvatar(false);
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
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

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir usuário");
      }

      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido do sistema."
      });

      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const formatLastActive = (date?: Date) => {
    if (!date) return "Nunca";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return "Recentemente";
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Usuário",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span>{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "celular",
      header: "Celular",
      render: (user) => (
        <span className="text-sm">{user.celular || "-"}</span>
      ),
    },
    {
      key: "role",
      header: "Função",
      render: (user) => (
        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
          {user.role === "admin" ? "Admin" : "Cliente"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
          <span className="text-sm capitalize">{user.status === "active" ? "Ativo" : "Inativo"}</span>
        </div>
      ),
    },
    {
      key: "lastActive",
      header: "Último Acesso",
      render: (user) => (
        <span className="text-muted-foreground text-sm">{formatLastActive(user.lastActive)}</span>
      ),
    },
  ];

  const actions: DataListAction<User>[] = [
    {
      label: "Editar",
      icon: <Pencil className="w-4 h-4 mr-2" />,
      onClick: handleEdit,
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4 mr-2" />,
      onClick: (user) => handleDelete(user.id),
      className: "text-destructive focus:text-destructive",
    },
  ];

  const filterOptions: FilterOption[] = [
    { label: "Todos", value: "all" },
    { label: "Administradores", value: "admin" },
    { label: "Clientes", value: "client" },
  ];

  const renderUserCard = (user: User, actionsNode?: React.ReactNode) => (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
      <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-600/20 relative">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {actionsNode}
        </div>
      </div>
      <CardContent className="pt-0 -mt-10 flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 border-4 border-background shadow-lg mb-3">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg leading-none mb-1">{user.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
        {user.celular && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <Phone className="w-3 h-3" /> {user.celular}
          </p>
        )}
        
        <div className="w-full grid grid-cols-2 gap-2 text-sm mb-4">
          <div className="flex flex-col bg-secondary/30 p-2 rounded-md">
            <span className="text-xs text-muted-foreground">Função</span>
            <span className="font-medium capitalize">{user.role === "admin" ? "Admin" : "Cliente"}</span>
          </div>
          <div className="flex flex-col bg-secondary/30 p-2 rounded-md">
            <span className="text-xs text-muted-foreground">Status</span>
            <span className="font-medium capitalize flex items-center justify-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
              {user.status === "active" ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full text-xs h-8" onClick={() => handleEdit(user)}>
          Gerenciar Perfil
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <PageHeader 
            icon={Users}
            title="Gerenciar Usuários"
            subtitle="Visualize, crie e gerencie os usuários do sistema."
          />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingUser(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <DialogTitle>{editingUser ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                      Preencha os dados abaixo para {editingUser ? "atualizar" : "cadastrar"} o usuário.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-border">
                      <AvatarImage src={previewAvatar || undefined} />
                      <AvatarFallback className="text-2xl">
                        {form.watch("name")?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      {previewAvatar && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md"
                          onClick={handleRemoveAvatar}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...form.register("name")} placeholder="Nome completo" />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" {...form.register("email")} placeholder="email@exemplo.com" />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input id="celular" {...form.register("celular")} placeholder="(00) 00000-0000" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select 
                    onValueChange={(val: "admin" | "client") => form.setValue("role", val)} 
                    value={form.watch("role")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.role && (
                    <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha {editingUser && "(deixe em branco para manter)"}
                  </Label>
                  <PasswordInput 
                    id="password" 
                    {...form.register("password")} 
                    placeholder={editingUser ? "********" : "Senha segura"} 
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isSubmitting || isUploadingAvatar}
                  >
                    {isSubmitting || isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isUploadingAvatar ? "Enviando foto..." : "Salvando..."}
                      </>
                    ) : (
                      editingUser ? "Salvar Alterações" : "Criar Usuário"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataList
          data={filteredUsers}
          columns={columns}
          renderCard={renderUserCard}
          actions={actions}
          searchPlaceholder="Buscar por nome ou email..."
          searchKeys={["name", "email"]}
          filterLabel="Filtrar por função"
          filterOptions={filterOptions}
          onFilterChange={(value) => setRoleFilter(value as "all" | "admin" | "client")}
          currentFilter={roleFilter}
          emptyMessage="Nenhum usuário encontrado."
          defaultView="cards"
          getItemKey={(user) => user.id}
        />
      </div>
    </Layout>
  );
}
