import { User, Child } from './types';

const STORAGE_KEYS = {
  users: 'nutrimap_users',
  children: 'nutrimap_children',
  session: 'nutrimap_session',
  theme: 'nutrimap_theme',
};

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.users);
    return data ? JSON.parse(data) : [];
  },
  
  setUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  },
  
  getChildren: (): Child[] => {
    const data = localStorage.getItem(STORAGE_KEYS.children);
    return data ? JSON.parse(data) : [];
  },
  
  setChildren: (children: Child[]) => {
    localStorage.setItem(STORAGE_KEYS.children, JSON.stringify(children));
  },
  
  // Session stores the authenticated user and bearer token returned by the backend
  getSession: (): { user?: User | null; token?: string } | null => {
    const data = localStorage.getItem(STORAGE_KEYS.session);
    return data ? JSON.parse(data) : null;
  },

  setSession: (session: { user?: User | null; token?: string } | null) => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  },
  
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.theme) as 'light' | 'dark') || 'light';
  },
  
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  },
};
