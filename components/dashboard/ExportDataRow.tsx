'use client';

import { Download } from 'lucide-react';

import { PrivacyRow } from '@/components/dashboard/PrivacyRow';

import { useProfileActions } from './useProfileActions';

export function ExportDataRow() {
  const { exporting, handleExport } = useProfileActions();

  return (
    <PrivacyRow
      icon={Download}
      title={exporting ? 'Exporting…' : 'Export your data'}
      description="Download everything Vantea has stored about you as a JSON file."
      onClick={handleExport}
    />
  );
}
