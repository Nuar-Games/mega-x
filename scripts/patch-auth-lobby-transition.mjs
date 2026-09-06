import fs from 'node:fs'

const path = 'src/App.tsx'
let source = fs.readFileSync(path, 'utf8')

const startupOld = `        if (!profile?.fighter_handle) {\n          if (googleSession) setOnlineScreen('HANDLE')\n          return\n        }\n        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatch(session)])\n        if (disposed) return\n        setLeaderboardRows(leaders)\n        if (match) {\n          if (googleSession) applyOnlineMatchView(match)\n          else {\n            latestMatchIdRef.current = match.id\n            latestMatchVersionRef.current = Number(match.state_version)\n            setActiveOnlineMatch(match)\n          }\n        } else if (googleSession) {\n          setOnlineScreen('LOBBY')\n        }`

const startupNew = `        if (!profile?.fighter_handle) {\n          setOnlineScreen('HANDLE')\n          return\n        }\n        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatch(session)])\n        if (disposed) return\n        setLeaderboardRows(leaders)\n        if (match) {\n          applyOnlineMatchView(match)\n        } else {\n          setOnlineScreen('LOBBY')\n        }`

if (!source.includes(startupOld)) throw new Error('saved-session lobby transition anchor missing')
source = source.replace(startupOld, startupNew)

const submitOld = `      setOnlineSession(session)\n      const profile = await loadProfile(session)\n      setFighterProfile(profile)\n      if (profile?.fighter_handle) {\n        setLeaderboardRows(await getTop10Leaderboard(session))\n        setOnlineScreen('LOBBY')\n      } else setOnlineScreen('HANDLE')`

const submitNew = `      setOnlineSession(session)\n      const profile = await loadProfile(session)\n      setFighterProfile(profile)\n      if (profile?.fighter_handle) {\n        setOnlineScreen('LOBBY')\n        void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)\n      } else setOnlineScreen('HANDLE')`

if (!source.includes(submitOld)) throw new Error('email sign-in lobby transition anchor missing')
source = source.replace(submitOld, submitNew)

fs.writeFileSync(path, source)
console.log('Fixed email and saved-session transitions into Lobby')
