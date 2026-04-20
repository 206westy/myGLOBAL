import { LayoutDashboard, Workflow, Target, MessagesSquare } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export interface LandingCardData {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  href: string;
}

export const LANDING_CARDS: LandingCardData[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Real-time KPI, equipment status, and predictive analytics',
    badge: 'mySITE · mySERVICE · mySUPPORT',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'workspace',
    title: 'Workspace',
    subtitle: 'Automation agents that handle routine operational tasks',
    badge: 'Agents',
    icon: Workflow,
    href: '/workspace',
  },
  {
    id: 'strategy',
    title: 'Strategy',
    subtitle: 'CIP planning, kanban boards, and project timelines',
    badge: 'myATHENA',
    icon: Target,
    href: '/strategy',
  },
  {
    id: 'chat',
    title: 'AI Chat',
    subtitle: 'Ask about internal documents and data in natural language',
    badge: 'myBOT',
    icon: MessagesSquare,
    href: '/aichat',
  },
];
