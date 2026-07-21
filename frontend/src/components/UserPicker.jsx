import { useState, useEffect } from 'react';
import api from '../services/api';

export default function UserPicker({ role, placeholder, value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const roleParam = role ? `&role=${role}` : '';
        const { data } = await api.get(`/users/search?search=${encodeURIComponent(query)}${roleParam}`);
        setResults(data);
      } catch (err) {
        console.error('User search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, role]);

  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      setQuery('');
    }
  }, [value]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    onChange(user._id);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange('');
    setQuery('');
  };

  if (selectedUser || (value && !selectedUser)) {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 h-[38px]">
        <span className="text-sm text-accent truncate">
          <span className="text-text-muted mr-1">Selected:</span>
          <span className="font-medium">{selectedUser?.name || value}</span>
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto flex h-5 w-5 items-center justify-center rounded-md border border-border bg-elevated text-xs text-text-faint hover:text-text-primary hover:border-border-strong transition-colors"
          title="Clear selection"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder={placeholder || 'Search by name or email…'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full rounded-lg border border-border bg-elevated px-4 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
      />
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-xs text-text-faint">Searching…</div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {results.map((u) => (
                <li key={u._id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(u)}
                    className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-elevated focus:bg-elevated outline-none transition-colors"
                  >
                    <span className="text-sm font-medium text-text-primary">{u.name}</span>
                    <span className="text-xs text-text-faint">{u.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-xs text-text-faint">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
