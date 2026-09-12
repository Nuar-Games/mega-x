import fs from 'node:fs'

const authPath = 'src/onlineAuth.ts'
const appPath = 'src/App.tsx'
let auth = fs.readFileSync(authPath, 'utf8')
let app = fs.readFileSync(appPath, 'utf8')

if (!auth.includes('export type AdminPlayerRow')) {
  auth += `\n\nexport type AdminStatus = {\n  is_admin: boolean\n  silenced: boolean\n  suspended: boolean\n  silenced_until: string | null\n  suspended_until: string | null\n}\n\nexport type AdminPlayerRow = {\n  user_id: string\n  fighter_handle: string | null\n  email: string | null\n  silenced: boolean\n  suspended: boolean\n  silenced_until: string | null\n  suspended_until: string | null\n}\n\nexport async function getMyAdminStatus(session: OnlineSession): Promise<AdminStatus> {\n  const rows = await rpcAuthed(session, 'get_my_admin_status')\n  const row = Array.isArray(rows) ? rows[0] : rows\n  return row || { is_admin: false, silenced: false, suspended: false, silenced_until: null, suspended_until: null }\n}\n\nexport async function adminListPlayers(session: OnlineSession): Promise<AdminPlayerRow[]> {\n  return rpcAuthed(session, 'admin_list_players')\n}\n\nexport async function adminSetSilenced(session: OnlineSession, playerId: string, enabled: boolean) {\n  await rpcAuthed(session, 'admin_set_silenced', { p_player: playerId, p_enabled: enabled })\n}\n\nexport async function adminSetSuspended(session: OnlineSession, playerId: string, enabled: boolean) {\n  await rpcAuthed(session, 'admin_set_suspended', { p_player: playerId, p_enabled: enabled })\n}\n`
}

if (!app.includes("getMyAdminStatus")) app = `import { getMyAdminStatus, adminListPlayers, adminSetSilenced, adminSetSuspended } from './onlineAuth'\n` + app

if (!app.includes('mega-x-admin-panel')) {
  const hookAnchor = '  async function challengeFighter'
  if (!app.includes(hookAnchor)) throw new Error('admin hook anchor missing')
  const hook = `  const [mxAdminOpen, setMxAdminOpen] = useState(false)\n  const [mxIsAdmin, setMxIsAdmin] = useState(false)\n  const [mxAdminPlayers, setMxAdminPlayers] = useState<any[]>([])\n  const [mxAdminBusy, setMxAdminBusy] = useState(false)\n\n  const refreshMxAdmin = async () => {\n    if (!onlineSession) return\n    const status = await getMyAdminStatus(onlineSession)\n    setMxIsAdmin(Boolean(status?.is_admin))\n    if (status?.suspended) {\n      await signOut(onlineSession).catch(() => undefined)\n      setOnlineSession(null)\n      setOnlineScreen('AUTH')\n      setOnlineMessage('ACCOUNT SUSPENDED')\n      return\n    }\n    if (status?.is_admin) setMxAdminPlayers(await adminListPlayers(onlineSession))\n  }\n\n  useEffect(() => {\n    if (!onlineSession) { setMxIsAdmin(false); setMxAdminPlayers([]); return }\n    void refreshMxAdmin().catch(() => undefined)\n  }, [onlineSession?.userId])\n\n  const mxModerate = async (playerId: string, kind: 'MUTE' | 'BAN', enabled: boolean) => {\n    if (!onlineSession || mxAdminBusy) return\n    setMxAdminBusy(true)\n    try {\n      if (kind === 'MUTE') await adminSetSilenced(onlineSession, playerId, enabled)\n      else await adminSetSuspended(onlineSession, playerId, enabled)\n      setMxAdminPlayers(await adminListPlayers(onlineSession))\n    } catch (error) {\n      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'ADMIN ACTION FAILED')\n    } finally {\n      setMxAdminBusy(false)\n    }\n  }\n\n`
  app = app.replace(hookAnchor, hook + hookAnchor)

  const signout = '<button className="mx-lobby-signout" onClick={leaveOnlineSession}>SIGN OUT</button>'
  if (!app.includes(signout)) throw new Error('admin lobby button anchor missing')
  app = app.replace(signout, `{mxIsAdmin && <button className="mx-lobby-signout" onClick={() => setMxAdminOpen(true)}>ADMIN</button>}\n              ${signout}`)

  const panelAnchor = '{onlineMessage && <div className="mx-live-status mx-lobby-status" role="status">{onlineMessage}</div>}'
  if (!app.includes(panelAnchor)) throw new Error('admin panel render anchor missing')
  const panel = `${panelAnchor}\n          {mxIsAdmin && mxAdminOpen && <div className="mega-x-admin-panel" style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.88)',display:'grid',placeItems:'center',padding:20}}>\n            <div style={{width:'min(820px,96vw)',maxHeight:'82vh',overflow:'auto',background:'#090d14',border:'1px solid rgba(255,210,90,.45)',boxShadow:'0 24px 80px rgba(0,0,0,.7)',padding:20}}>\n              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:16}}><strong style={{letterSpacing:2}}>ADMIN · PLAYER CONTROL</strong><button onClick={() => setMxAdminOpen(false)}>CLOSE</button></div>\n              {mxAdminPlayers.length === 0 ? <div>NO PLAYER ACCOUNTS</div> : mxAdminPlayers.map((p:any) => <div key={p.user_id} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,alignItems:'center',padding:'10px 0',borderTop:'1px solid rgba(255,255,255,.08)'}}>\n                <div><strong>{p.fighter_handle || 'UNCLAIMED'}</strong><div style={{fontSize:12,opacity:.62}}>{p.email || p.user_id}</div></div>\n                <button disabled={mxAdminBusy} onClick={() => void mxModerate(p.user_id,'MUTE',!p.silenced)}>{p.silenced ? 'UNMUTE' : 'MUTE'}</button>\n                <button disabled={mxAdminBusy} onClick={() => void mxModerate(p.user_id,'BAN',!p.suspended)}>{p.suspended ? 'UNBAN' : 'BAN'}</button>\n              </div>)}\n            </div>\n          </div>}`
  app = app.replace(panelAnchor, panel)
}

if (!auth.includes('adminSetSuspended') || !app.includes('mega-x-admin-panel')) throw new Error('admin controls patch incomplete')
fs.writeFileSync(authPath, auth)
fs.writeFileSync(appPath, app)
console.log('Applied authenticated admin moderation controls')
