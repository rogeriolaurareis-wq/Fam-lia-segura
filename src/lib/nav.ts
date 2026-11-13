import {
  Backpack,
  createLucideIcon,
  Droplet,
  BriefcaseMedical,
  Home,
  Info,
  LayoutDashboard,
  Megaphone,
  PawPrint,
  Puzzle,
  Route as RouteIcon,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Three connected nodes in a triangle (protection network). */
const NetworkNodes: LucideIcon = createLucideIcon("network-nodes", [
  ["circle", { cx: "12", cy: "5", r: "2.2", key: "a" }],
  ["circle", { cx: "5", cy: "18", r: "2.2", key: "b" }],
  ["circle", { cx: "19", cy: "18", r: "2.2", key: "c" }],
  ["path", { d: "m11 7-5 9M13 7l5 9M7.2 18h9.6", key: "d" }],
]);

export interface NavItem {
  to:
    | "/"
    | "/familia"
    | "/animais"
    | "/moradia"
    | "/rede"
    | "/reservas"
    | "/equipamentos"
    | "/saida"
    | "/saude"
    | "/entretenimento"
    | "/avisos"
    | "/sobre";
  code?: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/familia", code: "M01", label: "Minha família", icon: Users },
  { to: "/animais", code: "M02", label: "Animais", icon: PawPrint },
  { to: "/moradia", code: "M03", label: "Moradia", icon: Home },
  { to: "/rede", code: "M04", label: "Rede e check-in", icon: NetworkNodes },
  { to: "/reservas", code: "M05", label: "Reservas", icon: Droplet },
  { to: "/equipamentos", code: "M06", label: "Equipamentos", icon: Backpack },
  { to: "/saida", code: "M07", label: "Plano de saída", icon: RouteIcon },
  { to: "/saude", code: "M08", label: "Saúde e cuidados", icon: BriefcaseMedical },
  { to: "/entretenimento", code: "M09", label: "Entretenimento essencial", icon: Puzzle },
  { to: "/avisos", code: "M10", label: "Avisos", icon: Megaphone },
  { to: "/sobre", label: "Sobre esta versão", icon: Info },
];
