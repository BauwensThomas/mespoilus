'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import GuideDownloadModal from '@/components/guides/GuideDownloadModal';

interface GuideDownloadButtonProps {
  guide: { id: string; title: string; slug: string };
  className?: string;
  label?: string;
}

export default function GuideDownloadButton({
  guide,
  className,
  label = 'Télécharger gratuitement',
}: GuideDownloadButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={
          className ??
          'inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2'
        }
        aria-label={`Télécharger le guide : ${guide.title}`}
      >
        <Download size={18} strokeWidth={2} />
        {label}
      </button>

      {modalOpen && (
        <GuideDownloadModal guide={guide} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
