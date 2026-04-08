"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface PokemonData {
  id: number;
  name: string;
  japaneseName: string;
  imageUrl: string;
  cryUrl: string;
  types: string[];
  generation: string;
  abilities: string[];
}

interface HintState {
  type: boolean;
  generation: boolean;
  ability: boolean;
}

const GENERATION_MAP: Record<string, string> = {
  "generation-i":    "第1世代（赤・緑・青）",
  "generation-ii":   "第2世代（金・銀）",
  "generation-iii":  "第3世代（ルビー・サファイア）",
  "generation-iv":   "第4世代（ダイヤモンド・パール）",
  "generation-v":    "第5世代（ブラック・ホワイト）",
  "generation-vi":   "第6世代（X・Y）",
  "generation-vii":  "第7世代（サン・ムーン）",
  "generation-viii": "第8世代（ソード・シールド）",
  "generation-ix":   "第9世代（スカーレット・バイオレット）",
};

function toKatakana(str: string): string {
  return str.trim().replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

export default function PokemonQuiz() {
  const [pokemon,    setPokemon]    = useState<PokemonData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [revealed,   setRevealed]   = useState(false);
  const [answer,     setAnswer]     = useState("");
  const [message,    setMessage]    = useState("");
  const [msgType,    setMsgType]    = useState<"correct"|"wrong"|"giveup"|"">("");
  const [hints,      setHints]      = useState<HintState>({ type: false, generation: false, ability: false });
  const [shaking,    setShaking]    = useState(false);
  const [showFlash,  setShowFlash]  = useState(false);
  const [answered,   setAnswered]   = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPokemon = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    setRevealed(false);
    setAnswer("");
    setMessage("");
    setMsgType("");
    setAnswered(false);
    setHints({ type: false, generation: false, ability: false });

    try {
      const id = Math.floor(Math.random() * 1010) + 1;
      const [pokeRes, speciesRes] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
      ]);
      if (!pokeRes.ok || !speciesRes.ok) throw new Error("fetch failed");

      const pokeJson    = await pokeRes.json();
      const speciesJson = await speciesRes.json();

      const jaEntry =
        speciesJson.names.find((n: {language:{name:string};name:string}) => n.language.name === "ja-Hrkt") ||
        speciesJson.names.find((n: {language:{name:string};name:string}) => n.language.name === "ja");
      const japaneseName = jaEntry?.name ?? pokeJson.name;

      const typeData: Array<{names:Array<{language:{name:string};name:string}>;name:string}> =
        await Promise.all(pokeJson.types.map((t:{type:{url:string}}) => fetch(t.type.url).then(r => r.json())));
      const jpTypes = typeData.map(t => {
        const e = t.names.find(n => n.language.name === "ja") || t.names.find(n => n.language.name === "ja-Hrkt");
        return e?.name ?? t.name;
      });

      const abilityData: Array<{names:Array<{language:{name:string};name:string}>;name:string}> =
        await Promise.all(pokeJson.abilities.slice(0, 3).map((a:{ability:{url:string}}) => fetch(a.ability.url).then(r => r.json())));
      const jpAbilities = abilityData.map(a => {
        const e = a.names.find(n => n.language.name === "ja") || a.names.find(n => n.language.name === "ja-Hrkt");
        return e?.name ?? a.name;
      });

      const generation = GENERATION_MAP[speciesJson.generation.name] ?? speciesJson.generation.name;
      const imageUrl   = pokeJson.sprites?.other?.["official-artwork"]?.front_default ?? pokeJson.sprites?.front_default ?? "";
      const cryUrl     = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

      setPokemon({ id, name: pokeJson.name, japaneseName, imageUrl, cryUrl, types: jpTypes, generation, abilities: jpAbilities });
      setTimeout(() => playCryUrl(cryUrl), 600);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchPokemon(); }, [fetchPokemon]);

  const playCryUrl = (url: string) => {
    audioRef.current?.pause();
    audioRef.current = null;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = 0.8;
    audio.play().catch(() => {});
  };
  const playCry = () => { if (pokemon) playCryUrl(pokemon.cryUrl); };

  const revealPokemon = () => {
    setRevealed(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 900);
  };

  const handleAnswer = () => {
    if (!pokemon || !answer.trim() || answered) return;
    if (toKatakana(answer.trim()) === toKatakana(pokemon.japaneseName)) {
      revealPokemon();
      setMessage(`せいかい！ 「${pokemon.japaneseName}」 でした！`);
      setMsgType("correct");
      setAnswered(true);
    } else {
      setMessage("ちがう！ もう一度かんがえてみよう！");
      setMsgType("wrong");
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setMessage("");
        setMsgType("");
      }, 1200);
      inputRef.current?.focus();
    }
  };

  const handleGiveUp = () => {
    if (!pokemon || answered) return;
    revealPokemon();
    setMessage(`こたえは 「${pokemon.japaneseName}」 でした！`);
    setMsgType("giveup");
    setAnswered(true);
  };

  const openHint = (key: keyof HintState) => {
    if (!pokemon) return;
    setHints(prev => ({ ...prev, [key]: true }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnswer();
  };

  // ── hint display entries ──
  const hintEntries = [
    { key: "type" as const,       label: "タイプ",    value: pokemon?.types.join(" / "),     open: hints.type },
    { key: "generation" as const, label: "初登場世代", value: pokemon?.generation,            open: hints.generation },
    { key: "ability" as const,    label: "とくせい",   value: pokemon?.abilities.join(" / "), open: hints.ability },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <p style={{ fontFamily: "var(--font-jp), sans-serif", fontWeight: 900, fontSize: "18px", color: "var(--ink-soft)" }}>よみこみ中…</p>
        <div style={{ display: "flex", gap: "10px" }}>
          {[0,1,2].map(i => (
            <div key={i} className="load-dot" style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--red)", border: "2px solid var(--ink)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError || !pokemon) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-jp), sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--red)", textAlign: "center" }}>データの読み込みに失敗しました。</p>
        <button className="btn btn-answer" onClick={fetchPokemon}>もう一度あそぶ</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative", zIndex: 1 }}>
      <div className="deco-ball" style={{ width: 320, height: 320, bottom: -100, right: -80 }} />
      <div className="deco-ball" style={{ width: 180, height: 180, top: -50, left: -60 }} />

      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 1 }}>

        {/* ── Title ── */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "var(--font-nunito), sans-serif",
            fontWeight: 900,
            fontSize: "clamp(22px, 7vw, 32px)",
            color: "var(--ink)",
            letterSpacing: "0.04em",
            WebkitTextStroke: "3px var(--ink)",
            textShadow: "3px 3px 0 var(--yellow), 5px 5px 0 var(--ink)",
            lineHeight: 1.2,
          }}>だ〜れだ？</h1>
        </div>

        {/* ── Main card ── */}
        <div className="anime-card card-main" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          {showFlash && (
            <div className="reveal-flash" style={{ position: "absolute", inset: 0, background: "white", zIndex: 20, borderRadius: "inherit" }} />
          )}
          <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
            {pokemon.imageUrl ? (
              <Image
                src={pokemon.imageUrl}
                alt={revealed ? pokemon.japaneseName : "シルエット"}
                width={150} height={150}
                className={`pokemon-silhouette${revealed ? " revealed" : ""}`}
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                draggable={false} priority
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>?</div>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={playCry} style={{ width: "100%", textAlign: "center" }}>
              🔊 なきごえ
            </button>
          </div>
        </div>

        {/* ── Hint card (fixed height) ── */}
        <div className="anime-card" style={{ padding: "12px 14px" }}>
          <p className="section-label" style={{ marginBottom: "8px" }}>ヒント</p>

          {/* Chip row — always 3 chips, fixed */}
          <div style={{ display: "flex", gap: "8px" }}>
            {hintEntries.map(({ key, label, open }) => (
              <button
                key={key}
                className={`hint-chip-closed${open ? " hint-chip-active" : ""}`}
                onClick={() => openHint(key)}
                disabled={open || answered}
                style={{ flex: 1, textAlign: "center" }}
              >
                {open ? "✓ " : "💡 "}{label}
              </button>
            ))}
          </div>

          {/* Revealed content area — always render all 3 rows so height never changes */}
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {hintEntries.map(({ key, label, value, open }) => (
              <div
                key={key}
                className="hint-chip-open"
                style={{ display: "flex", alignItems: "baseline", gap: "8px", visibility: open ? "visible" : "hidden" }}
              >
                <span className="hint-label" style={{ flexShrink: 0 }}>{label}</span>
                <span>{open ? value : "　"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Answer card (fixed height — buttons swap to result) ── */}
        <div className={`anime-card${shaking ? " shake" : ""}`} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            ref={inputRef}
            type="text"
            className="anime-input"
            placeholder="ポケモンのなまえ"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={answered}
            autoComplete="off"
            autoCapitalize="none"
          />

          {/* Action area: always the same height */}
          {!answered ? (
            /* Before answer: こたえる + ギブアップ */
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-answer" style={{ flex: 1 }} onClick={handleAnswer} disabled={!answer.trim()}>
                こたえる！
              </button>
              <button className="btn btn-giveup" onClick={handleGiveUp}>
                ギブアップ
              </button>
            </div>
          ) : (
            /* After answer: message + next button side by side */
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="pop-in">
              <div
                className={`msg-box ${msgType === "correct" ? "msg-correct" : "msg-giveup"}`}
                style={{ flex: 1, padding: "8px 12px", fontSize: "13px", margin: 0 }}
              >
                {message}
              </div>
              <button className="btn btn-next" style={{ width: "auto", padding: "10px 14px", fontSize: "13px", animation: "none", flexShrink: 0 }} onClick={fetchPokemon}>
                つぎへ ▶
              </button>
            </div>
          )}

          {/* Wrong message — inline, auto-disappears */}
          {msgType === "wrong" && message && (
            <div className="msg-box msg-wrong pop-in" style={{ padding: "6px 12px", fontSize: "13px" }}>
              {message}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
