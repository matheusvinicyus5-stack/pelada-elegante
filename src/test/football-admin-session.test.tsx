import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FootballAdminProvider } from '@/components/football-admin';
import { useFootballAdmin } from '@/components/football-admin-context';
import { getDirectionToken, setDirectionToken, clearDirectionToken } from '@/lib/direction-token-storage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(), logout: vi.fn(), change: vi.fn(), save: vi.fn(), setActive: vi.fn(), active: false,
  players: [{ id: 1, name: 'Capitão', position: 'MC', points: 0, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 0 }],
  matches: [{ id: 1, date: '10 de outubro de 2026', short: '10 OUT', scoreA: 0, scoreB: 0, teamA: [1], teamB: [2], captainA: 1, captainB: 2 }],
}));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@/lib/football.functions', () => ({ enterDirection: mocks.login, exitDirection: mocks.logout, changeDirectionPassword: mocks.change }));
vi.mock('@/components/football-state', () => ({ useFootball: () => ({ ...mocks }) }));
vi.mock('@/components/football', () => ({ PlayerAvatar: () => null }));

function Controls() {
  const admin = useFootballAdmin();
  return <>
    <button onClick={admin.openLogin}>Login</button>
    <button onClick={admin.openPassword}>Senha</button>
    <button onClick={admin.logout}>Sair</button>
    <button onClick={() => { const player = mocks.players[0]; if (player) admin.deletePlayer(player); }}>Excluir capitão</button>
  </>;
}
function mount() { render(<FootballAdminProvider><Controls /></FootballAdminProvider>); }
beforeEach(() => { vi.clearAllMocks(); clearDirectionToken(); mocks.active = false; mocks.login.mockResolvedValue({ ok: true, token: '1.signed' }); mocks.change.mockResolvedValue({ ok: true, token: '2.signed' }); mocks.logout.mockResolvedValue({ ok: true }); mocks.save.mockResolvedValue(undefined); });
afterEach(cleanup);
describe('Direction session and captain removal', () => {
  it('stores the verified token after login', async () => {
    mount(); fireEvent.click(screen.getByText('Login'));
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(true));
    expect(getDirectionToken()).toBe('1.signed');
  });
  it('does not unlock or store a token after rejected login', async () => {
    mocks.login.mockResolvedValue({ ok: false }); mount(); fireEvent.click(screen.getByText('Login'));
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('alert'); expect(getDirectionToken()).toBeUndefined(); expect(mocks.setActive).not.toHaveBeenCalled();
  });
  it('forwards the token when changing the password and replaces it', async () => {
    mocks.active = true; setDirectionToken('1.signed'); mount(); fireEvent.click(screen.getByText('Senha'));
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'new-password' } });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'new-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }));
    await waitFor(() => expect(getDirectionToken()).toBe('2.signed'));
    expect(mocks.change).toHaveBeenCalledWith({ data: { current: 'old-password', password: 'new-password', token: '1.signed' } });
  });
  it('clears the browser token after logout', async () => {
    mocks.active = true; setDirectionToken('1.signed'); mount(); fireEvent.click(screen.getByText('Sair'));
    await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(false)); expect(getDirectionToken()).toBeUndefined();
  });
  it('removes the deleted captain from lineups while preserving the other captain', async () => {
    mocks.active = true; mount(); fireEvent.click(screen.getByText('Excluir capitão'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
    expect(mocks.save.mock.calls[0]?.[0]).toEqual({ players: [], matches: [{ ...mocks.matches[0], teamA: [], captainA: undefined }] });
  });
});