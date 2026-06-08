'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Download } from 'lucide-react';
import type { PdfGuide } from '@/lib/guides';
import { CATEGORY_CONFIG } from '@/lib/guides';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

interface GuidesGridProps {
  guides: PdfGuide[];
}

export default function GuidesGrid({ guides }: GuidesGridProps) {
  const [activeGuide, setActiveGuide] = useState<PdfGuide | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-container">
        {guides.map((guide, idx) => {
          const cfg = CATEGORY_CONFIG[guide.category] ?? CATEGORY_CONFIG['general'];
          const Icon = cfg.icon;

          return (
            <div
              key={guide.id}
              className="stagger-child bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 hover:border-orange-300 transition-all duration-300 group"
              style={{ transitionDelay: `${idx * 0.05}s` }}
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 fade-up">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge} hover:scale-105 transition-transform duration-200`}>
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
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <FileText size={13} strokeWidth={1.5} />
                  <span>{guide.pages_count} page{guide.pages_count > 1 ? 's' : ''}</span>
                </div>
                <button
                  onClick={() => setActiveGuide(guide)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 hover:scale-105 shadow-md"
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