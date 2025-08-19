"use client";  // クライアントコンポーネントにするために追加

import axios from 'axios';
import { useState, useEffect } from 'react';

const getPokemonData = async (id) => {
  const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const japaneseName = speciesResponse.data.names.find((name) => name.language.name === 'ja');
  return {
    id,
    japaneseName: japaneseName.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    cryUrl: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`,
  };
};

const PokemonShadow = () => {
  const [pokemon, setPokemon] = useState(null);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [isGiveUp, setIsGiveUp] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 新しいポケモンを取得する関数
  const fetchPokemon = async () => {
    const randomId = Math.floor(Math.random() * 151) + 1;
    const data = await getPokemonData(randomId);
    setPokemon(data);
    setGuess('');
    setIsCorrect(null);
    setIsGiveUp(false);
    setImageLoaded(false); // 新しいポケモンを取得したときは画像がまだロードされていない
  };

  useEffect(() => {
    fetchPokemon(); // 初期ロード時にポケモンを取得
  }, []);

  const handleGuess = (e) => {
    e.preventDefault();
    if (guess === pokemon.japaneseName) {
      setIsCorrect(true);
      const audio = new Audio(pokemon.cryUrl);
      audio.play();
    } else {
      setIsCorrect(false);
    }
  };

  const handleGiveUp = () => {
    setIsGiveUp(true);
    const audio = new Audio(pokemon.cryUrl);
    audio.play();
  };

  if (!pokemon) return <p>読み込み中...</p>;

  return (
    <div className="container">
      <h1>だ～れだ？</h1>

      <div className="image-container">
        {/* 画像がロードされるまでシルエットを非表示 */}
        {!imageLoaded && <p>画像を読み込み中...</p>}
        <img
          src={pokemon.sprite}
          alt="ポケモンのシルエット"
          className={isCorrect || isGiveUp ? 'revealed' : 'silhouette'}
          onLoad={() => setImageLoaded(true)} // 画像がロードされたら表示
          style={{ display: imageLoaded ? 'block' : 'none' }} // 画像がロードされるまで非表示
        />
      </div>

      <div className="message-container">
        {isCorrect === true && <p>正解！ポケモンは {pokemon.japaneseName} です！</p>}
        {isCorrect === false && !isGiveUp && <p>不正解！もう一度試してみてください。</p>}
        {isGiveUp && <p>ギブアップ！ポケモンは {pokemon.japaneseName} です。</p>}
      </div>

      <div className="input-container">
        {!isCorrect && !isGiveUp && (
          <form onSubmit={handleGuess} className="guess-form">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="名前を入力してね"
              aria-label="名前を入力してね"
            />
            <button type="submit" className="submit-button">回答</button>
          </form>
        )}
      </div>


      <div className="button-container">
        {!isCorrect && !isGiveUp && (
          <button onClick={handleGiveUp} className="give-up-button">
            ギブアップ
          </button>
        )}
        {(isCorrect || isGiveUp) && (
          <button onClick={fetchPokemon} className="next-question-button">
            次の問題へ
          </button>
        )}
      </div>
    </div>
  );
};

export default PokemonShadow;


