'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Download, Dog, Cat, Rat, Bird, Shell } from 'lucide-react';
import type { PdfGuide } from '@/app/guides/page';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

const CATEGORY_CONFIG: Record<string, { label: string; badge: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }> = {
  chiens:   { label: 'Chiens',   badge: 'bg-orange-100 text-orange-700 border-orange-200', icon: Dog      },
  chats:    { label: 'Chats',    badge: 'bg-pink-100 text-pink-700 border-pink-200',       icon: Cat      },
  rongeurs: { label: 'Rongeurs', badge: 'bg-green-100 text-green-700 border-green-200',    icon: Rat      },
  oiseaux:  { label: 'Oiseaux',  badge: 'bg-blue-100 text-blue-700 border-blue-200',       icon: Bird     },
  reptiles: { label: 'Reptiles', badge: 'bg-teal-100 text-teal-700 border-teal-200',       icon: Shell    },
  general:  { label: 'Général',  badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileText },
};

interface GuidesGridProps {
  guides: PdfGuide[];
}

export default function GuidesGrid({ guides }: GuidesGridProps) {
  const [activeGuide, setActiveGuide] = useState<PdfGuide | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => {
          const cfg = CATEGORY_CONFIG[guide.category] ?? CATEGORY_CONFIG['general'];
          const Icon = cfg.icon;

          return (
            <div
              key={guide.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
            >
              {/* Category badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                  <Icon size={13} strokeWidth={2} />
                  {cfg.label}
                </span>
              </div>

              {/* Title & description */}
              <div className="flex-1">
                <Link
                  href={`/guides/${guide.slug}`}
                  className="text-base font-bold text-gray-900 hover:text-orange-600 transition-colors leading-snug block mb-2"
                >
                  {guide.title}
                </Link>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {guide.description}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <FileText size={13} strokeWidth={1.5} />
                  <span>{guide.pages_count} page{guide.pages_count > 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => setActiveGuide(guide)}
                  className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                  aria-label={`Télécharger le guide : ${guide.title}`}
                >
                  <Download size={13} strokeWidth={2} />
                  Télécharger gratuitement
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeGuide && (
        <GuideDownloadModal
          guide={{ id: activeGuide.id, title: activeGuide.title, slug: activeGuide.slug }}
          onClose={() => setActiveGuide(null)}
        />
      )}
    </>
  );
}
