import './App.css'
import { useState } from 'react'

function App() {
  const [beatmap, setBeatmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [beatmapList, setBeatmapList] = useState([])
  const [isContinueAvialible, setIsContinueAvialible] = useState(false)

  const getRandomBeatmap = async () => {
    console.log('🎲 Начинаем запрос случайной карты...');
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Отправляем запрос к серверу...');
      const response = await fetch('http://localhost:3001/random-beatmap');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Получены данные от сервера:', JSON.stringify(data, null, 2));

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Получены пустые данные от сервера');
      }

      if (!data.title || !data.artist) {
        throw new Error('Неполные данные карты');
      }

      console.log('✅ Данные карты валидны:', {
        id: data.id,
        beatmapset_id: data.beatmapset_id,
        title: data.title,
        artist: data.artist,
        difficulty_rating: data.difficulty_rating,
        version: data.version,
        creator: data.creator
      });

      setIsContinueAvialible(true)

      setBeatmapList(prev => [...prev, data])
      console.log(beatmapList)
      setBeatmap(data);
    } catch (error) {
      console.error('❌ Ошибка при получении карты:', error);
      setError(error.message);
      setBeatmap(null);
    } finally {
      setLoading(false);
      console.log('🏁 Запрос завершен');
    }
  }

  const nextMap = () => {
    setIsContinueAvialible(false)
  }

  return (
    <>
      <h1>Welcome to osu! beatmap roulette</h1>
      <button
        onClick={getRandomBeatmap}
        disabled={loading || isContinueAvialible}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'wait' : 'pointer',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {loading ? 'Загрузка...' : 'Получить случайную карту'}
      </button>

      {error && (
        <div style={{
          color: 'red',
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          ❌ Ошибка: {error}
        </div>
      )}

      {[...beatmapList].reverse().map(beatmap => (
        <div key={beatmap.id}
          style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
          <h2 style={{ margin: '0 0 10px 0' }}>{beatmap.title}</h2>
          <p style={{ margin: '5px 0' }}>Исполнитель: {beatmap.artist}</p>
          <p style={{ margin: '5px 0' }}>Сложность: {beatmap.version} ({beatmap.difficulty_rating}★)</p>
          <p style={{ margin: '5px 0' }}>Создатель: {beatmap.creator}</p>
          <p style={{ margin: '5px 0' }}>ID карты: {beatmap.id}</p>
          {beatmap.beatmapset_id ? (
            <a
              href={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapset_id}#osu/${beatmap.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#FF66AA',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#FF3388'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#FF66AA'}
            >
              Открыть в osu!
            </a>
          ) : (
            <p style={{
              marginTop: '15px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              Ссылка на карту недоступна
            </p>
          )
          }
          <div style={{
            display: 'flex',
            gap: '5px'
          }}>
            <button onClick={() => nextMap()} style={{
              padding: '10px 20px',
              background: '#28a745',
              borderRadius: '999px',
              border: 'none',
              color: "#fff"
            }}>
              Completed
            </button>
            <button onClick={() => end()} style={{
              padding: '10px 20px',
              background: '#dc3545',
              borderRadius: '999px',
              border: 'none',
              color: "#fff"
            }}>
              Give Up
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

export default App
