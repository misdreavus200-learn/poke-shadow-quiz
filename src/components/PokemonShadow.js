"use client";  // クライアントコンポーネントにするために追加

import axios from 'axios';
import { useState, useEffect } from 'react';

// ポケモンのデータを取得（日本語名と鳴き声ファイル）
const getPokemonData = async (id) => {
  const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const japaneseName = speciesResponse.data.names.find((name) => name.language.name === 'ja');
  return {
    id,
    japaneseName: japaneseName.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
    cryUrl: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`, // 鳴き声ファイルのURL
  };
};

const PokemonShadow = () => {
  const [pokemon, setPokemon] = useState(null);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    const fetchPokemon = async () => {
      const randomId = Math.floor(Math.random() * 151) + 1; // 151匹のポケモンからランダムに選択
      const data = await getPokemonData(randomId);
      setPokemon(data);
    };

    fetchPokemon();
  }, []);

  const handleGuess = (e) => {
    e.preventDefault();
    if (guess === pokemon.japaneseName) {
      setIsCorrect(true);

      // 鳴き声を再生
      const audio = new Audio(pokemon.cryUrl);
      audio.play();
    } else {
      setIsCorrect(false);
    }
  };

  if (!pokemon) return <p>読み込み中...</p>;

  return (
    <div className="container">
      <h1>このポケモンは誰でしょう？</h1>
      <div className="image-container">
        <img
          src={pokemon.sprite}
          alt="ポケモンのシルエット"
        />
      </div>
      <form onSubmit={handleGuess}>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="ポケモンの名前を入力してください"
          aria-label="ポケモンの名前を入力してください"
        />
        <button type="submit">送信</button>
      </form>
      {isCorrect === true && <p>正解！ポケモンは {pokemon.japaneseName} です！</p>}
      {isCorrect === false && <p>不正解！もう一度試してみてください。</p>}
    </div>
  );
};

export default PokemonShadow;


