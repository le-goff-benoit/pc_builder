import { listBuilds } from '@/lib/queries';
import { HomeView } from '@/components/HomeView';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomeView initialBuilds={listBuilds()} />;
}
