import { useState, ReactNode } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Search, Grid, List, Filter, MoreVertical } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface DataListAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  className?: string;
}

export interface DataListProps<T> {
  data: T[];
  columns: Column<T>[];
  renderCard: (item: T, actions?: ReactNode) => ReactNode;
  actions?: DataListAction<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filterLabel?: string;
  filterOptions?: FilterOption[];
  onFilterChange?: (value: string) => void;
  currentFilter?: string;
  emptyMessage?: string;
  defaultView?: "cards" | "table";
  getItemKey: (item: T) => string;
}

export function DataList<T>({
  data,
  columns,
  renderCard,
  actions = [],
  searchPlaceholder = "Buscar...",
  searchKeys = [],
  filterLabel = "Filtrar",
  filterOptions = [],
  onFilterChange,
  currentFilter = "all",
  emptyMessage = "Nenhum item encontrado.",
  defaultView = "cards",
  getItemKey,
}: DataListProps<T>) {
  const [viewMode, setViewMode] = useState<"table" | "cards">(defaultView);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item => {
    if (!searchQuery || searchKeys.length === 0) return true;
    
    return searchKeys.some(key => {
      const value = item[key];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });
  });

  const renderActions = (item: T) => {
    if (actions.length === 0) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <DropdownMenuItem 
              key={index} 
              onClick={() => action.onClick(item)}
              className={action.className}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="p-4 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg w-fit">
            <Button 
              variant={viewMode === "cards" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode("cards")}
            >
              <Grid className="w-4 h-4 mr-2" /> Cards
            </Button>
            <Button 
              variant={viewMode === "table" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4 mr-2" /> Lista
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={searchPlaceholder}
                className="pl-9 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filterOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => onFilterChange?.(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <CardContent className="pt-4">
        {viewMode === "table" ? (
          <div className="rounded-md border border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={String(col.key)} className={col.className}>
                      {col.header}
                    </TableHead>
                  ))}
                  {actions.length > 0 && (
                    <TableHead className="text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={getItemKey(item)} className="group hover:bg-secondary/20 transition-colors">
                      {columns.map((col) => (
                        <TableCell key={String(col.key)} className={col.className}>
                          {col.render 
                            ? col.render(item) 
                            : String((item as any)[col.key] ?? "")}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell className="text-right">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {renderActions(item)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredData.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed border-border">
                {emptyMessage}
              </div>
            ) : (
              filteredData.map((item) => (
                <div key={getItemKey(item)}>
                  {renderCard(item, renderActions(item))}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
