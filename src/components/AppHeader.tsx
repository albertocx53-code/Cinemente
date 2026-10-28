'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type RefObject } from 'react';
import { Avatar, Logo } from './brand';
import { IconBell, IconChevronDown, IconHelp, IconHome, IconList, IconLogout, IconSearch, IconSettings, IconUser, IconUsers, IconX } from './icons';
import { markNotificationsRead } from '@/app/actions/library';

export type HeaderNotification = { id: string; title: string; body: string | null; link: string | null; read: boolean };

const NAV = [
  { href: '/navegar', label: 'Início' },
  { href: '/navegar/filmes', label: 'Filmes' },
  { href: '/navegar/series', label: 'Séries educativas' },
  { href: '/navegar/documentarios', label: 'Documentários' },
  { href: '/navegar/curtas', label: 'Curtas' },
  { href: '/navegar/videoaulas', label: 'Videoaulas' },
  { href: '/navegar/filosofia', label: 'Filosofia' },
  { href: '/navegar/sociologia', label: 'Sociologia' },
  { href: '/navegar/materiais', label: 'Materiais pedagógicos' },
  { href: '/navegar/minha-lista', label: 'Minha lista' },
];

function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOutside(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onOutside(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [ref, onOutside]);
}

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(pathname === '/buscar');
  const [q, setQ] = useState(pathname === '/buscar' ? params.get('q') ?? '' : '');
  const [items, setItems] = useState<{ label: string; href: string; kind: string }[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useClickOutside(box, () => { setItems([]); if (!q) setOpen(false); });

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/busca/sugestoes?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (r.ok) setItems((await r.json()).items ?? []);
      } catch { /* digitação continuou */ }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const KIND: Record<string, string> = { titulo: 'Título', pensador: 'Pensador', conceito: 'Conceito', tema: 'Tema' };
  return (
    <div className={`search-box${open ? ' is-open' : ''}`} ref={box}>
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); setItems([]); if (q.trim()) router.push(`/buscar?q=${encodeURIComponent(q.trim())}`); }}
      >
        <button
          type={open ? 'submit' : 'button'}
          className="tool-btn"
          aria-label={open ? 'Pesquisar' : 'Abrir pesquisa'}
          onClick={(e) => { if (!open) { e.preventDefault(); setOpen(true); setTimeout(() => input.current?.focus(), 30); } }}
        >
          <IconSearch />
        </button>
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Títulos, filósofos, conceitos"
          aria-label="Pesquisar no CineMente"
          tabIndex={open ? 0 : -1}
          autoComplete="off"
        />
        {open && q && <button type="button" className="tool-btn" aria-label="Limpar" onClick={() => { setQ(''); input.current?.focus(); }}><IconX /></button>}
      </form>
      {items.length > 0 && (
        <div className="suggest" role="listbox" aria-label="Sugestões">
          {items.map((s) => (
            <Link key={s.href + s.label} href={s.href} role="option" aria-selected={false} onClick={() => setItems([])}>
              <span>{s.label}</span><small>{KIND[s.kind]}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppHeader({ profile, notifications }: { profile: { name: string; avatarKey: string }; notifications: HeaderNotification[] }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [menu, setMenu] = useState<'none' | 'notif' | 'profile'>('none');
  const [unread, setUnread] = useState(notifications.filter((n) => !n.read).length);
  const navRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);
  useClickOutside(navRef, () => setNavOpen(false));
  useClickOutside(notifRef, () => setMenu((m) => (m === 'notif' ? 'none' : m)));
  useClickOutside(profRef, () => setMenu((m) => (m === 'profile' ? 'none' : m)));

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setNavOpen(false); setMenu('none'); }, [pathname]);

  const current = NAV.find((n) => n.href === pathname)?.label ?? 'Navegar';

  const openNotifs = () => {
    const next = menu === 'notif' ? 'none' : 'notif';
    setMenu(next);
    if (next === 'notif' && unread > 0) { setUnread(0); markNotificationsRead().catch(() => {}); }
  };

  return (
    <>
      <header className={`app-header${solid ? ' is-solid' : ''}`}>
        <Logo href="/navegar" />
        <div ref={navRef}>
          <button type="button" className="app-nav-toggle" aria-expanded={navOpen} aria-controls="menu-principal" onClick={() => setNavOpen((v) => !v)}>
            {current} <IconChevronDown width={14} height={14} />
          </button>
          <nav id="menu-principal" className={`app-nav${navOpen ? ' is-open' : ''}`} aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="app-tools">
          <Suspense fallback={<span className="tool-btn"><IconSearch /></span>}>
            <SearchBox />
          </Suspense>
          <div className="menu" ref={notifRef}>
            <button type="button" className="tool-btn hide-mobile" aria-label={`Notificações${unread ? ` (${unread} novas)` : ''}`} aria-expanded={menu === 'notif'} onClick={openNotifs}>
              <IconBell />
              {unread > 0 && <span className="tool-badge">{unread}</span>}
            </button>
            {menu === 'notif' && (
              <div className="menu-panel" role="menu" style={{ width: 'min(340px, 86vw)' }}>
                <div className="menu-head">Notificações</div>
                {notifications.length === 0 && <div className="menu-head">Nenhuma notificação por enquanto.</div>}
                {notifications.map((n) => (
                  <Link key={n.id} href={n.link || '/navegar'} className={`notif${n.read ? '' : ' notif--new'}`} role="menuitem">
                    <strong>{n.title}</strong>
                    {n.body && <span>{n.body}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="menu" ref={profRef}>
            <button type="button" className="avatar-btn" aria-label={`Menu do perfil ${profile.name}`} aria-expanded={menu === 'profile'} onClick={() => setMenu(menu === 'profile' ? 'none' : 'profile')}>
              <Avatar avatarKey={profile.avatarKey} size="sm" />
              <IconChevronDown className="hide-mobile" />
            </button>
            {menu === 'profile' && (
              <div className="menu-panel" role="menu">
                <div className="menu-head">Perfil: <strong style={{ color: '#fff' }}>{profile.name}</strong></div>
                <Link href="/perfis" role="menuitem"><IconUsers /> Trocar de perfil</Link>
                <Link href="/perfis?gerenciar=1" role="menuitem"><IconUser /> Gerenciar perfis</Link>
                <Link href="/conta" role="menuitem"><IconSettings /> Conta e configurações</Link>
                <Link href="/ajuda" role="menuitem"><IconHelp /> Central de ajuda</Link>
                <hr />
                <form action="/sair" method="post">
                  <button type="submit" role="menuitem"><IconLogout /> Sair do CineMente</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Atalhos">
        <Link href="/navegar" aria-current={pathname === '/navegar' ? 'page' : undefined}><IconHome />Início</Link>
        <Link href="/buscar" aria-current={pathname === '/buscar' ? 'page' : undefined}><IconSearch />Buscar</Link>
        <Link href="/navegar/minha-lista" aria-current={pathname === '/navegar/minha-lista' ? 'page' : undefined}><IconList />Minha lista</Link>
        <Link href="/perfis" aria-current={pathname === '/perfis' ? 'page' : undefined}><IconUser />Perfis</Link>
      </nav>
    </>
  );
}
