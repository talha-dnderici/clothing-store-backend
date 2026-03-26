'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

type StudioTab = 'products' | 'users' | 'sessions' | 'cards';

interface ProductRecord {
  id: string;
  name: string;
}

interface UserRecord {
  id: string;
  name: string;
  role?: string;
}

interface SessionRecord {
  id: string;
  email: string;
  isActive: boolean;
}

interface CardRecord {
  id: string;
  status: string;
  items: Array<unknown>;
}

export function StudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('products');
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [message, setMessage] = useState('All backend services are available from this studio.');

  const [productCreate, setProductCreate] = useState({
    name: 'Shadow Runner',
    description: 'Low profile silhouette with an all black upper.',
    category: 'sneaker',
    price: '129.9',
    stock: '24',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  });
  const [productId, setProductId] = useState('');
  const [productPatch, setProductPatch] = useState('{\n  "price": 119.9\n}');

  const [userCreate, setUserCreate] = useState({
    name: 'Product Lead',
    email: 'lead@clothes.local',
    password: 'Admin123!',
    taxId: 'TR6543219870',
    address: 'Istanbul / Levent',
    role: 'productManager',
  });
  const [userId, setUserId] = useState('');
  const [userPatch, setUserPatch] = useState('{\n  "role": "salesManager"\n}');

  const [sessionId, setSessionId] = useState('');
  const [sessionPatch, setSessionPatch] = useState('{\n  "isActive": false\n}');

  const [cardId, setCardId] = useState('');
  const [cardPatch, setCardPatch] = useState('{\n  "status": "checked_out"\n}');

  useEffect(() => {
    void Promise.all([loadProducts(), loadUsers(), loadSessions(), loadCards()]);
  }, []);

  async function wrapAction(title: string, action: () => Promise<void>, successMessage: string) {
    try {
      await action();
      setMessage(`${title}: ${successMessage}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${title} failed`);
    }
  }

  async function loadProducts() {
    setProducts(await apiRequest<ProductRecord[]>('/products', { method: 'GET' }));
  }

  async function loadUsers() {
    setUsers(await apiRequest<UserRecord[]>('/users', { method: 'GET' }));
  }

  async function loadSessions() {
    setSessions(await apiRequest<SessionRecord[]>('/sessions', { method: 'GET' }));
  }

  async function loadCards() {
    setCards(await apiRequest<CardRecord[]>('/cards', { method: 'GET' }));
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await wrapAction(
      'Create product',
      async () => {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify({
            ...stripEmpty(productCreate),
            price: Number(productCreate.price),
            stock: Number(productCreate.stock),
          }),
        });
        await loadProducts();
      },
      'Product created.',
    );
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await wrapAction(
      'Create user',
      async () => {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(stripEmpty(userCreate)),
        });
        await loadUsers();
      },
      'User created.',
    );
  }

  async function patchAndRefresh(path: string, body: string, reload: () => Promise<void>, title: string) {
    await wrapAction(
      title,
      async () => {
        await apiRequest(path, { method: 'PATCH', body });
        await reload();
      },
      'Update completed.',
    );
  }

  async function deleteAndRefresh(path: string, reload: () => Promise<void>, title: string) {
    await wrapAction(
      title,
      async () => {
        await apiRequest(path, { method: 'DELETE' });
        await reload();
      },
      'Delete completed.',
    );
  }

  return (
    <div className="page-stack">
      <section className="studio-hero">
        <div>
          <p className="eyebrow">Studio</p>
          <h1>Clean control surface for every backend service.</h1>
        </div>
      </section>

      <section className="message-strip">
        <strong>Studio</strong>
        <span>{message}</span>
      </section>

      <div className="studio-tabs">
        {(['products', 'users', 'sessions', 'cards'] as StudioTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'top-tab is-active' : 'top-tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' ? (
        <section className="dual-grid">
          <form className="content-card" onSubmit={(event) => void createProduct(event)}>
            <div className="section-topline"><h2>Create product</h2></div>
            <InputFields values={productCreate} onChange={setProductCreate} textareaKeys={['description']} />
            <button type="submit" className="primary-button">Create product</button>
          </form>
          <CrudEditor
            title="Edit products"
            idValue={productId}
            onIdChange={setProductId}
            patchValue={productPatch}
            onPatchChange={setProductPatch}
            onPatch={() => void patchAndRefresh(`/products/${productId}`, productPatch, loadProducts, 'Patch product')}
            onDelete={() => void deleteAndRefresh(`/products/${productId}`, loadProducts, 'Delete product')}
            onRefresh={() => void loadProducts()}
            items={products.map((item) => `${item.name} - ${item.id}`)}
          />
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="dual-grid">
          <form className="content-card" onSubmit={(event) => void createUser(event)}>
            <div className="section-topline"><h2>Create user</h2></div>
            <InputFields values={userCreate} onChange={setUserCreate} />
            <button type="submit" className="primary-button">Create user</button>
          </form>
          <CrudEditor
            title="Edit users"
            idValue={userId}
            onIdChange={setUserId}
            patchValue={userPatch}
            onPatchChange={setUserPatch}
            onPatch={() => void patchAndRefresh(`/users/${userId}`, userPatch, loadUsers, 'Patch user')}
            onDelete={() => void deleteAndRefresh(`/users/${userId}`, loadUsers, 'Delete user')}
            onRefresh={() => void loadUsers()}
            items={users.map((item) => `${item.name} (${item.role || 'customer'}) - ${item.id}`)}
          />
        </section>
      ) : null}

      {activeTab === 'sessions' ? (
        <CrudEditor
          title="Edit sessions"
          idValue={sessionId}
          onIdChange={setSessionId}
          patchValue={sessionPatch}
          onPatchChange={setSessionPatch}
          onPatch={() => void patchAndRefresh(`/sessions/${sessionId}`, sessionPatch, loadSessions, 'Patch session')}
          onDelete={() => void deleteAndRefresh(`/sessions/${sessionId}`, loadSessions, 'Delete session')}
          onRefresh={() => void loadSessions()}
          items={sessions.map((item) => `${item.email} - ${item.isActive ? 'active' : 'inactive'} - ${item.id}`)}
        />
      ) : null}

      {activeTab === 'cards' ? (
        <CrudEditor
          title="Edit cards"
          idValue={cardId}
          onIdChange={setCardId}
          patchValue={cardPatch}
          onPatchChange={setCardPatch}
          onPatch={() => void patchAndRefresh(`/cards/${cardId}`, cardPatch, loadCards, 'Patch card')}
          onDelete={() => void deleteAndRefresh(`/cards/${cardId}`, loadCards, 'Delete card')}
          onRefresh={() => void loadCards()}
          items={cards.map((item) => `${item.status} - ${item.items.length} items - ${item.id}`)}
        />
      ) : null}
    </div>
  );
}

function CrudEditor({
  title,
  idValue,
  onIdChange,
  patchValue,
  onPatchChange,
  onPatch,
  onDelete,
  onRefresh,
  items,
}: {
  title: string;
  idValue: string;
  onIdChange: (value: string) => void;
  patchValue: string;
  onPatchChange: (value: string) => void;
  onPatch: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  items: string[];
}) {
  return (
    <section className="content-card">
      <div className="section-topline"><h2>{title}</h2></div>
      <div className="field-stack">
        <label className="field">
          <span>Document ID</span>
          <input value={idValue} onChange={(event) => onIdChange(event.target.value)} />
        </label>
        <label className="field">
          <span>Patch JSON</span>
          <textarea value={patchValue} onChange={(event) => onPatchChange(event.target.value)} />
        </label>
      </div>
      <div className="button-row">
        <button type="button" className="primary-button" onClick={onPatch}>Patch</button>
        <button type="button" className="selection-button" onClick={onDelete}>Delete</button>
        <button type="button" className="text-button" onClick={onRefresh}>Refresh</button>
      </div>
      <div className="compact-panel">
        <strong>Records</strong>
        <ul>
          {items.length === 0 ? <li>No records yet.</li> : items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}

function InputFields<T extends Record<string, string>>({
  values,
  onChange,
  textareaKeys = [],
}: {
  values: T;
  onChange: React.Dispatch<React.SetStateAction<T>>;
  textareaKeys?: string[];
}) {
  return (
    <div className="field-stack">
      {Object.entries(values).map(([key, value]) => (
        <label key={key} className="field">
          <span>{toLabel(key)}</span>
          {textareaKeys.includes(key) ? (
            <textarea
              value={value}
              onChange={(event) =>
                onChange((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          ) : (
            <input
              value={value}
              type={key === 'password' ? 'password' : 'text'}
              onChange={(event) =>
                onChange((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}

function stripEmpty<T extends Record<string, string>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ''),
  );
}

function toLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}
