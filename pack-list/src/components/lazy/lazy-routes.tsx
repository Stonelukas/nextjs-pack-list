import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy route components
export const LazyTemplateLibrary = dynamic(
  () => import('@/components/templates/template-library').then(mod => mod.TemplateLibrary),
  {
    loading: () => <LoadingSpinner />,
    ssr: true
  }
);

export const LazyListDetail = dynamic(
  () => import('@/components/lists/list-detail').then(mod => mod.ListDetail),
  {
    loading: () => <LoadingSpinner />,
    ssr: true
  }
);

export const LazyProgressReport = dynamic(
  () => import('@/components/progress/progress-report').then(mod => mod.ProgressReport),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);