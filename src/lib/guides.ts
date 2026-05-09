import { Dog, Cat, Rat, Bird, Shell, FileText } from 'lucide-react';

export interface PdfGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  pages_count: number;
}

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; badge: string; icon: typeof Dog }
> = {
  chiens:   { label: 'Chiens',   color: 'text-orange-600',  badge: 'bg-orange-100 text-orange-700 border-orange-200',  icon: Dog      },
  chats:    { label: 'Chats',    color: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700 border-pink-200',        icon: Cat      },
  rongeurs: { label: 'Rongeurs', color: 'text-green-600',   badge: 'bg-green-100 text-green-700 border-green-200',     icon: Rat      },
  oiseaux:  { label: 'Oiseaux',  color: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700 border-blue-200',        icon: Bird     },
  reptiles: { label: 'Reptiles', color: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700 border-teal-200',        icon: Shell    },
  general:  { label: 'Général',  color: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700 border-purple-200',  icon: FileText },
};
