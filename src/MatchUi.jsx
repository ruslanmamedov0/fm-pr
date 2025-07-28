import { teams } from "./teams";
import "./MatchUi.css";
import { useState, useEffect } from "react";

export default function MatchUi() {
    const teamA = teams[0];
    const teamB = teams[1];

    const [goalHome, setGoalHome] = useState(0);
    const [goalAway, setGoalAway] = useState(0);
    const [commentary, setCommentary] = useState([]);
    const [minute, setMinute] = useState(0);
    const [matchEnded, setMatchEnded] = useState(false);

    const safe = (val) => Number(val) || 0;

    const calculateTeamAreas = (team) => {
        let attack = 0;
        let midfield = 0;
        let defense = 0;

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

   const simulateMatchFlow = (teamA, teamB, goalsA, goalsB, setCommentary) => {
    let minute = 1;
    let commentaryLog = [];
    const totalDuration = 15_000; // 15 saniye
    const interval = totalDuration / 90; // her dakika 167ms

    let currentGoalA = 0;
    let currentGoalB = 0;

    const matchInterval = setInterval(() => {
        const rand = Math.random();

        if (rand < 0.03 && currentGoalA < goalsA) {
            currentGoalA++;
            commentaryLog.push(`${minute}'. dakikada ${teamA.name} golü buldu! Skor: ${currentGoalA} - ${currentGoalB}`);
        } else if (rand < 0.06 && currentGoalB < goalsB) {
            currentGoalB++;
            commentaryLog.push(`${minute}'. dakikada ${teamB.name} gol attı! Skor: ${currentGoalA} - ${currentGoalB}`);
        } else if (rand < 0.12) {
            commentaryLog.push(`${minute}'. dakikada ${teamA.name} tehlikeli bir atak geliştirdi.`);
        } else if (rand < 0.18) {
            commentaryLog.push(`${minute}'. dakikada ${teamB.name} kaleyi yokladı.`);
        } else if (rand < 0.23) {
            commentaryLog.push(`${minute}'. dakikada hakem ${teamA.name} oyuncusuna sarı kart gösterdi.`);
        } else if (rand < 0.26) {
            commentaryLog.push(`${minute}'. dakikada ${teamB.name} oyuncusu kırmızı kart gördü!`);
        }

        setCommentary([...commentaryLog]);

        if (minute >= 90) {
            commentaryLog.push("Maç sona erdi.");
            setCommentary([...commentaryLog]);
            clearInterval(matchInterval);
        }

        minute++;
    }, interval);
};

    const startMatch = () => {
        setMinute(0);
        setGoalHome(0);
        setGoalAway(0);
        setCommentary([]);
        setMatchEnded(false);

        const interval = setInterval(() => {
            setMinute((prevMinute) => {
                const next = prevMinute + 1;

                generateLiveCommentary(next, goalHome, goalAway);

                if (next >= 90) {
                    clearInterval(interval);
                    setMatchEnded(true);
                }

                return next;
            });
        }, 266); // ~15 saniyede 90 dakika
    };

    return (
        <div className="match-container">
            <div className="team">
                <img src={teamA.logo} alt={teamA.name} className="team-logo" />
                <h3>{teamA.name}</h3>
                <ul className="players-list">
                    {teamA.players.map((p) => (
                        <li key={p.id}>
                            <b>{p.name}</b> ({p.position})
                            <ul className="stats-list">
                                {Object.entries(p.stats).map(([stat, value]) => (
                                    <li key={stat}>
                                        <span>{stat}</span>: <span>{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="score-section">
                <div className="score">
                    <span>{goalHome}</span>
                    <span>:</span>
                    <span>{goalAway}</span>
                </div>
                <div>🕒 Dakika: {minute}</div>
                <button className="start-btn" onClick={startMatch} disabled={!matchEnded && minute > 0}>
                    Maçı Başlat
                </button>

                <div className="commentary-section">
                    <h4>📣 Maç Anlatımı</h4>
                    <ul>
                        {commentary.map((cmt, index) => (
                            <li key={index}>{cmt}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="team">
                <img src={teamB.logo} alt={teamB.name} className="team-logo" />
                <h3>{teamB.name}</h3>
                <ul className="players-list">
                    {teamB.players.map((p) => (
                        <li key={p.id}>
                            <b>{p.name}</b> ({p.position})
                            <ul className="stats-list">
                                {Object.entries(p.stats).map(([stat, value]) => (
                                    <li key={stat}>
                                        <span>{stat}</span>: <span>{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
