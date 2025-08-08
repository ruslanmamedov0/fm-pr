import { teams } from "./teams"; // 8 takım var varsayıyorum
import "./MatchUi.css";
import { useState, useEffect, useRef } from "react";

export default function Tournament() {
  const [round, setRound] = useState("Çeyrek Final");
  const [matchIndex, setMatchIndex] = useState(0);

  const quarterFinalPairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ];

  const [quarterFinalWinners, setQuarterFinalWinners] = useState([]);
  const [semiFinalWinners, setSemiFinalWinners] = useState([]);
  const [finalWinner, setFinalWinner] = useState(null);

  const [goalStats, setGoalStats] = useState({});
  const [assistStats, setAssistStats] = useState({});
  const [mvpStats, setMvpStats] = useState({});

  const [matchesResults, setMatchesResults] = useState([]);

  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);

  const [goalHome, setGoalHome] = useState(0);
  const [goalAway, setGoalAway] = useState(0);
  const [commentary, setCommentary] = useState([]);
  const [minute, setMinute] = useState(0);
  const [matchEnded, setMatchEnded] = useState(false);

  const [matchStarted, setMatchStarted] = useState(false);
  const goalStatsRef = useRef({});
  const assistStatsRef = useRef({});

  useEffect(() => {
    console.log("Güncel Gol İstatistikleri:", goalStats);
  }, [goalStats]);

  useEffect(() => {
    console.log("Güncel Asist İstatistikleri:", assistStats);
  }, [assistStats]);

  const safe = (val) => Number(val) || 0;

  const calculateTeamAreas = (team) => {
    let attack = 0,
      midfield = 0,
      defense = 0;

    team.players.forEach((p) => {
      const s = p.stats;
      if (p.position === "FWD") {
        attack += safe(s.shot) + safe(s.dribbling) + safe(s.speed) + safe(s.physical);
      } else if (p.position === "MID") {
        midfield += safe(s.passing) + safe(s.physical) + safe(s.dribbling);
      } else {
        defense += safe(s.tackling) + safe(s.sliding) + safe(s.physical);
      }
    });

    return { attack, midfield, defense };
  };

  const calculateGoalsAdvanced = (teamStats, opponentStats) => {
    const possessionAdvantage =
      teamStats.midfield / (teamStats.midfield + opponentStats.midfield + 1);
    const effectiveness = teamStats.attack / (opponentStats.defense + 1);
    const randomFactor = Math.random() * 0.5;
    const goalChance = possessionAdvantage * effectiveness + randomFactor;
    return Math.max(0, Math.floor(goalChance * 3.5));
  };

  const getWeightedRandomPlayer = (team, role = "scorer") => {
    const weights = team.players.map((p) => {
      const s = p.stats;
      let score = 0;
      if (role === "scorer") {
        score = safe(s.shot) * 2 + safe(s.speed) + safe(s.dribbling) + safe(s.physical);
      } else if (role === "assister") {
        score = safe(s.passing) + safe(s.dribbling) + safe(s.vision || 0);
      }
      return { player: p, weight: score };
    });

    const totalWeight = weights.reduce((acc, cur) => acc + cur.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i].weight;
      if (rand <= 0) return weights[i].player;
    }
    return weights[0].player;
  };

  function registerGoal(player, teamName) {
    if (!goalStatsRef.current[player.id]) {
      goalStatsRef.current[player.id] = { name: player.name, team: teamName, goals: 0 };
    }
    goalStatsRef.current[player.id].goals += 1;
    updateMvpScore(player, teamName, 4);
  }

  function registerAssist(player, teamName) {
    if (!player) return;
    if (!assistStatsRef.current[player.id]) {
      assistStatsRef.current[player.id] = { name: player.name, team: teamName, assists: 0 };
    }
    assistStatsRef.current[player.id].assists += 1;
    updateMvpScore(player, teamName, 3);
  }

  function updateMvpScore(player, teamName, delta) {
    setMvpStats((prev) => {
      const updated = { ...prev };
      if (!updated[player.id]) {
        updated[player.id] = { name: player.name, team: teamName, score: 0 };
      }
      updated[player.id].score += delta;
      return updated;
    });
  }

  // --- MAÇ SIMÜLASYONU ---
  const simulateMatchFlow = (teamA_in, teamB_in, goalsA, goalsB, onMatchEndCallback) => {
    // local snapshot: (önemli — onMatchEnd ve startNextMatch sonrası state değişse bile geçmiş doğru kalsın)
    const localTeamA = teamA_in;
    const localTeamB = teamB_in;
    const matchRound = round;

    let minute = 1;
    let commentaryLog = [];
    const totalDuration = 8_000;
    const interval = totalDuration / 90;

    let currentGoalA = 0;
    let currentGoalB = 0;

    setMatchStarted(true);
    setMatchEnded(false);
    setMinute(0);
    setGoalHome(0);
    setGoalAway(0);
    setCommentary([]);

    const matchInterval = setInterval(() => {
      const rand = Math.random();

      if (rand < 0.03 && currentGoalA < goalsA) {
        currentGoalA++;
        setGoalHome(currentGoalA);

        const scorer = getWeightedRandomPlayer(localTeamA, "scorer");
        let assister = getWeightedRandomPlayer(localTeamA, "assister");
        if (assister?.id === scorer?.id) assister = null;

        commentaryLog.push(
          `${minute}'. dakikada ${localTeamA.name} golü buldu! ⚽️ Gol: ${scorer.name}` +
            (assister ? ` (Asist: ${assister.name})` : "") +
            `. Skor: ${currentGoalA} - ${currentGoalB}`
        );

        registerGoal(scorer, localTeamA.name);
        registerAssist(assister, localTeamA.name);
      } else if (rand < 0.06 && currentGoalB < goalsB) {
        currentGoalB++;
        setGoalAway(currentGoalB);

        const scorer = getWeightedRandomPlayer(localTeamB, "scorer");
        let assister = getWeightedRandomPlayer(localTeamB, "assister");
        if (assister?.id === scorer?.id) assister = null;

        commentaryLog.push(
          `${minute}'. dakikada ${localTeamB.name} gol attı! ⚽️ Gol: ${scorer.name}` +
            (assister ? ` (Asist: ${assister.name})` : "") +
            `. Skor: ${currentGoalA} - ${currentGoalB}`
        );

        registerGoal(scorer, localTeamB.name);
        registerAssist(assister, localTeamB.name);
      } else if (rand < 0.12) {
        commentaryLog.push(`${minute}'. dakikada ${localTeamA.name} tehlikeli bir atak geliştirdi.`);
      } else if (rand < 0.18) {
        commentaryLog.push(`${minute}'. dakikada ${localTeamB.name} kaleyi yokladı.`);
      } else if (rand < 0.23) {
        commentaryLog.push(`${minute}'. dakikada hakem ${localTeamA.name} oyuncusuna sarı kart gösterdi.`);
      } else if (rand < 0.26) {
        commentaryLog.push(`${minute}'. dakikada ${localTeamB.name} oyuncusu kırmızı kart gördü!`);
      }

      setCommentary([...commentaryLog]);
      setMinute(minute);

      if (minute >= 90) {
        commentaryLog.push("🔚 Maç sona erdi.");
        setCommentary([...commentaryLog]);

        clearInterval(matchInterval);
        setMatchEnded(true);
        setMatchStarted(false);

        // 1) önce kazanan/turnuva mantığını çalıştır
        onMatchEndCallback(currentGoalA, currentGoalB);

        // 2) sonra MAÇ SONU VERİSİNİ matchesResults'e ekle (burada commentaryLog tam ve local takımlar kullanılıyor)
        const goalsOnly = commentaryLog.filter((c) => c.toLowerCase().includes("gol"));
        setMatchesResults((prev) => [
          ...prev,
          {
            round: matchRound,
            teamA: localTeamA.name,
            teamB: localTeamB.name,
            score: `${currentGoalA} - ${currentGoalB}`,
            goals: goalsOnly,
          },
        ]);
      }
      minute++;
    }, interval);
  };

  // --- TUR YÖNETİMİ ---
  const startNextMatch = () => {
    let pair;
    if (round === "Çeyrek Final") {
      pair = quarterFinalPairs[matchIndex];
      if (!pair) return;
      setTeamA(teams[pair[0]]);
      setTeamB(teams[pair[1]]);
    } else if (round === "Yarı Final") {
      // guard: çeyrek finalistler hazır mı?
      if (quarterFinalWinners.length < 4) return;
      const semiPairs = [
        [quarterFinalWinners[0], quarterFinalWinners[1]],
        [quarterFinalWinners[2], quarterFinalWinners[3]],
      ];
      pair = semiPairs[matchIndex];
      if (!pair || !pair[0] || !pair[1]) return;
      setTeamA(pair[0]);
      setTeamB(pair[1]);
    } else if (round === "Final") {
      if (semiFinalWinners.length < 2) return;
      pair = [semiFinalWinners[0], semiFinalWinners[1]];
      setTeamA(pair[0]);
      setTeamB(pair[1]);
    }
  };

  // --- MAÇ BİTTİĞİNDE (SADELEŞTİRİLDİ: sadece kazanan/round/mvp/stat güncelle) ---
  const onMatchEnd = (scoreA, scoreB) => {
    let winner, loser;
    if (scoreA > scoreB) {
      winner = teamA;
      loser = teamB;
    } else if (scoreB > scoreA) {
      winner = teamB;
      loser = teamA;
    } else {
      winner = Math.random() < 0.5 ? teamA : teamB;
      loser = winner === teamA ? teamB : teamA;
      // penaltı mesajini commentary olarak eklemek istersen; fakat burada setMatchesResults yok
      setCommentary((prev) => [...prev, "Maç berabere bitti, penaltılarla kazanan belirlendi: " + winner.name]);
    }

    if (round === "Çeyrek Final") {
      setQuarterFinalWinners((prev) => [...prev, winner]);
      setMatchIndex((prev) => {
        if (prev + 1 < quarterFinalPairs.length) {
          return prev + 1;
        } else {
          setRound("Yarı Final");
          return 0;
        }
      });
    } else if (round === "Yarı Final") {
      setSemiFinalWinners((prev) => [...prev, winner]);
      setMatchIndex((prev) => {
        if (prev + 1 < 2) {
          return prev + 1;
        } else {
          setRound("Final");
          return 0;
        }
      });
    } else if (round === "Final") {
      setFinalWinner(winner);
      setRound("Turnuva Bitti");
    }

    // istatistikleri güncelle
    setGoalStats({ ...goalStatsRef.current });
    setAssistStats({ ...assistStatsRef.current });

    // NOT: setMatchesResults burada YOK — artık simulateMatchFlow tamamlanan commentaryLog ile doğrudan ekliyor.
  };

  useEffect(() => {
    if (round !== "Turnuva Bitti") {
      startNextMatch();
    }
  }, [round, matchIndex, quarterFinalWinners, semiFinalWinners]);

  const getTopPlayers = (statObj, statKey) => {
    return Object.values(statObj)
      .sort((a, b) => b[statKey] - a[statKey])
      .slice(0, 3);
  };

  const getMvp = () => {
    return Object.values(mvpStats).sort((a, b) => b.score - a.score)[0];
  };

  useEffect(() => {
    if (round === "Turnuva Bitti") {
      console.log("Goal Stats:", goalStats);
      console.log("Assist Stats:", assistStats);
    }
  }, [round]);

  return (
    <div className="tournament-container">
      <h2>🏆 8 Takımlı Turnuva</h2>
      <h3>{round}</h3>

      {round !== "Turnuva Bitti" && teamA && teamB && (
        <>
          <h4>
            {teamA.name} vs {teamB.name}
          </h4>
          <div className="score-section">
            <div className="score">
              <span>{goalHome}</span>
              <span>:</span>
              <span>{goalAway}</span>
            </div>
            <div>🕒 Dakika: {minute}</div>
            <button
              className="start-btn"
              onClick={() => {
                if (!matchStarted) {
                  const statsA = calculateTeamAreas(teamA);
                  const statsB = calculateTeamAreas(teamB);
                  const goalsA = calculateGoalsAdvanced(statsA, statsB);
                  const goalsB = calculateGoalsAdvanced(statsB, statsA);
                  simulateMatchFlow(teamA, teamB, goalsA, goalsB, onMatchEnd);
                }
              }}
              disabled={matchStarted}
            >
              Maçı Başlat
            </button>
          </div>

          <div className="commentary-section">
            <h4>📣 Maç Anlatımı</h4>
            <ul>
              {commentary.map((cmt, i) => (
                <li key={i}>{cmt}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {round === "Turnuva Bitti" && (
        <div className="results-section">
          <h3>🏆 Şampiyon: {finalWinner?.name || "Yok"}</h3>
          <h4>Gol Kralı</h4>
          <ul>
            {getTopPlayers(goalStats, "goals").map((p) => (
              <li key={p.name}>
                {p.name} ({p.team}) - {p.goals} gol
              </li>
            ))}
          </ul>

          <h4>Asist Kralı</h4>
          <ul>
            {getTopPlayers(assistStats, "assists").map((p) => (
              <li key={p.name}>
                {p.name} ({p.team}) - {p.assists} asist
              </li>
            ))}
          </ul>

          <h4>Turnuvanın En İyi Oyuncusu (MVP)</h4>
          <p>{getMvp()?.name || "Belirlenmedi"}</p>
        </div>
      )}

      <h3>📜 Turnuva Maç Geçmişi</h3>
      {matchesResults && matchesResults.length ? (
        matchesResults.map((match, index) => (
          <div
            key={index}
            style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
          >
            <strong>{match.round}:</strong> {match.teamA} vs {match.teamB} <br />
            <strong>Skor:</strong> {match.score}
            <ul>
              {match.goals.map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div>Henüz maç geçmişi yok.</div>
      )}
    </div>
  );
}
