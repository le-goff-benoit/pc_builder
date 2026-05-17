'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BuildSummary } from '@/lib/types';
import { formatEUR, formatDateShort } from '@/lib/format';
import { api } from '@/lib/api';
import { Field } from './Field';
import { ArrowLeft, Box, Plus, Spinner, Trash } from './icons';

export function HomeView({ initialBuilds }: { initialBuilds: BuildSummary[] }) {
  const router = useRouter();
  const [builds, setBuilds] = useState<BuildSummary[]>(initialBuilds);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBuild(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const build = await api.createBuild({
        name: name.trim(),
        description: description.trim(),
      });
      router.push(`/builds/${build.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.');
      setBusy(false);
    }
  }

  async function deleteBuild(id: number, label: string) {
    if (!window.confirm(`Supprimer le build « ${label} » et toutes ses pièces ?`)) {
      return;
    }
    setError(null);
    try {
      await api.deleteBuild(id);
      setBuilds(await api.listBuilds());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <>
      <section className="home-hero">
        <div>
          <span className="eyebrow">Atelier de montage</span>
          <h1 className="home-hero__title">
            Vos <em>builds PC</em>, suivis au composant près.
          </h1>
          <p className="home-hero__lead">
            Composez un build, empilez les alternatives pour chaque emplacement,
            reliez vos liens de commande et laissez Établi calculer le total et la
            date de réception.
          </p>
        </div>
      </section>

      {error && <div className="banner-error">{error}</div>}

      <form className="newbuild" onSubmit={createBuild}>
        <div className="newbuild__head">
          <Box size={18} />
          <h2>Nouveau build</h2>
        </div>
        <div className="form-grid">
          <Field label="Nom du build">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Station de jeu 2026"
              maxLength={120}
              autoFocus
            />
          </Field>
          <Field label="Description (optionnel)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectif, budget, usage prévu, contraintes… (ex. 1440p haute fréquence, budget ~1800 €, format compact)"
              maxLength={400}
            />
          </Field>
        </div>
        <div className="form-actions" style={{ marginTop: 14 }}>
          <button className="btn btn--primary" disabled={busy || !name.trim()}>
            {busy ? <Spinner size={15} className="spin" /> : <Plus size={15} />}
            {busy ? 'Création…' : 'Créer le build'}
          </button>
        </div>
      </form>

      <div className="section-label">
        <span className="eyebrow">
          Vos builds · {builds.length.toString().padStart(2, '0')}
        </span>
      </div>

      {builds.length === 0 ? (
        <div className="empty">
          <strong>Aucun build pour l’instant</strong>
          Créez votre premier build ci-dessus pour commencer à lister les pièces.
        </div>
      ) : (
        <div className="builds-grid stagger">
          {builds.map((build) => (
            <div className="buildcard" key={build.id}>
              <Link
                href={`/builds/${build.id}`}
                aria-label={`Ouvrir ${build.name}`}
                className="buildcard__link"
              >
                <div
                  className={
                    build.image_path
                      ? 'buildcard__cover'
                      : 'buildcard__cover buildcard__cover--empty'
                  }
                >
                  {build.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/builds/${build.id}/image?v=${encodeURIComponent(
                        build.image_path,
                      )}`}
                      alt=""
                    />
                  ) : (
                    <Box size={22} />
                  )}
                </div>

                <div className="buildcard__pad">
                  <span className="buildcard__name">{build.name}</span>
                  <p className="buildcard__desc">
                    {build.description || 'Pas de description.'}
                  </p>
                  <div className="buildcard__stats">
                    <div className="stat">
                      <div className="stat__num">{build.partCount}</div>
                      <div className="stat__label">Pièces</div>
                    </div>
                    <div className="stat">
                      <div className="stat__num stat__num--accent">
                        {formatEUR(build.totalPrice)}
                      </div>
                      <div className="stat__label">Total</div>
                    </div>
                    <div className="stat">
                      <div className="stat__num">{build.missingEssentialCount}</div>
                      <div className="stat__label">À combler</div>
                    </div>
                  </div>
                  <div className="buildcard__foot">
                    <span>créé le {formatDateShort(build.created_at)}</span>
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      ouvrir
                      <ArrowLeft size={12} style={{ transform: 'rotate(180deg)' }} />
                    </span>
                  </div>
                </div>
              </Link>
              <button
                className="iconbtn iconbtn--danger"
                style={{ position: 'absolute', top: 11, right: 11, zIndex: 2 }}
                onClick={() => deleteBuild(build.id, build.name)}
                aria-label={`Supprimer ${build.name}`}
                title="Supprimer le build"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
