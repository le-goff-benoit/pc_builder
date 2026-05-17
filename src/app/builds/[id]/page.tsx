import { notFound } from 'next/navigation';
import { getBuild } from '@/lib/queries';
import { BuildWorkspace } from './BuildWorkspace';

export const dynamic = 'force-dynamic';

export default async function BuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const build = getBuild(Number(id));
  if (!build) {
    notFound();
  }
  return <BuildWorkspace initialBuild={build} />;
}
