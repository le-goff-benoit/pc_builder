'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BuildDetail, Part } from '@/lib/types';
import { CATEGORIES } from '@/lib/categories';
import { computeStats } from '@/lib/compute';
import { formatDateShort, todayISO } from '@/lib/format';
import { api } from '@/lib/api';
import { Field } from '@/components/Field';
import { ArrowLeft, Bars, Layers, Pencil, Spinner, Trash } from '@/components/icons';
import { CategorySlot } from './CategorySlot';
import { ReceiptPanel } from './ReceiptPanel';
import { Comparator } from './Comparator';
import { BuildCover } from './BuildCover';

type Tab = 'build' | 'compare';

function BuildHeadEdit({
  build,
  onSave,
  onCancel,
}: {
  build: BuildDetail;
  onSave: (data: { name: string; description: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(build.name);
  const [description, setDescription] = useState(build.description);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="inline-form" style={{ marginTop: 14 }} onSubmit={submit}>
      <div className="inline-form__title">Modifier le build</div>
      <div className="form-grid">
        <Field label="Nom du build">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </Field>
      </div>
      <div className="form-actions" style={{ marginTop: 13 }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Annuler
        </button>
        <button className="btn btn--primary btn--sm" disabled={busy || !name.trim()}>
          {busy && <Spinner size={13} className="spin" />}
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export function BuildWorkspace({ initialBuild }: { initialBuild: BuildDetail }) {
  const router = useRouter();
  const [build, setBuild] = useState<BuildDetail>(initialBuild);
  const [vendors, setVendors] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('build');
  const [orderDate, setOrderDate] = useState<string>(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [editingHead, setEditingHead] = useState(false);

  const refresh = useCallback(async () => {
    const [fresh, vendorList] = await Promise.all([
      api.getBuild(build.id),
      api.listVendors(),
    ]);
    setBuild(fresh);
    setVendors(vendorList.map((vendor) => vendor.name));
  }, [build.id]);

  useEffect(() => {
    api
      .listVendors()
      .then((list) => setVendors(list.map((vendor) => vendor.name)))
      .catch(() => {});
  }, []);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      }
    },
    [refresh],
  );

  const stats = useMemo(() => computeStats(build.parts), [build.parts]);

  const partsByCategory = useMemo(() => {
    const map = new Map<string, Part[]>();
    for (const part of build.parts) {
      const list = map.get(part.category) ?? [];
      list.push(part);
      map.set(part.category, list);
    }
    return map;
  }, [build.parts]);

  async function deleteBuild() {
    if (!window.confirm(`Supprimer définitivement le build « ${build.name} » ?`)) {
      return;
    }
    try {
      await api.deleteBuild(build.id);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <>
      <div className="build-head">
        <Link href="/" className="linkback">
          <ArrowLeft size={13} /> tous les builds
        </Link>

        <BuildCover
          buildId={build.id}
          imagePath={build.image_path}
          onChange={refresh}
        />

        {editingHead ? (
          <BuildHeadEdit
            build={build}
            onSave={async (data) => {
              await run(() => api.updateBuild(build.id, data));
              setEditingHead(false);
            }}
            onCancel={() => setEditingHead(false)}
          />
        ) : (
          <div className="build-head__top">
            <div>
              <h1 className="build-head__title">{build.name}</h1>
              <p className="build-head__meta">
                BUILD #{String(build.id).padStart(3, '0')} · {build.parts.length}{' '}
                pièce{build.parts.length > 1 ? 's' : ''} · créé le{' '}
                {formatDateShort(build.created_at)}
              </p>
              {build.description && (
                <p className="build-head__desc">{build.description}</p>
              )}
            </div>
            <div className="build-head__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setEditingHead(true)}
              >
                <Pencil size={13} /> Renommer
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm btn--danger"
                onClick={deleteBuild}
              >
                <Trash size={13} /> Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="workspace">
        <div className="workspace__main">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'build'}
              className={tab === 'build' ? 'tab tab--active' : 'tab'}
              onClick={() => setTab('build')}
            >
              <Layers size={14} /> Build
              <span className="tab__count">
                {stats.selectedCount}/{build.parts.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'compare'}
              className={tab === 'compare' ? 'tab tab--active' : 'tab'}
              onClick={() => setTab('compare')}
            >
              <Bars size={14} /> Comparateur
            </button>
          </div>

          {error && <div className="banner-error">{error}</div>}

          {tab === 'build' ? (
            <div className="stagger">
              {CATEGORIES.map((category, index) => (
                <CategorySlot
                  key={category.key}
                  index={index + 1}
                  category={category}
                  buildId={build.id}
                  parts={partsByCategory.get(category.key) ?? []}
                  vendors={vendors}
                  run={run}
                />
              ))}
            </div>
          ) : (
            <Comparator build={build} run={run} />
          )}
        </div>

        <aside className="workspace__aside">
          <ReceiptPanel
            stats={stats}
            orderDate={orderDate}
            onOrderDateChange={setOrderDate}
          />
        </aside>
      </div>
    </>
  );
}
