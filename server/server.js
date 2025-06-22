import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Проверка наличия необходимых переменных окружения
if (!process.env.OSU_CLIENT_ID || !process.env.OSU_CLIENT_SECRET) {
  console.error('❌ Отсутствуют необходимые переменные окружения:');
  console.error('   - OSU_CLIENT_ID');
  console.error('   - OSU_CLIENT_SECRET');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

const url = new URL("https://osu.ppy.sh/oauth/token");

const headers = {
  Accept: "application/json",
  "Content-Type": "application/x-www-form-urlencoded",
};

let body = `client_id=${process.env.OSU_CLIENT_ID}&client_secret=${process.env.OSU_CLIENT_SECRET}&grant_type=client_credentials&scope=public`;

let accessToken = "";

async function getAccessToken() {
  console.log('🔄 Начинаем получение токена доступа...');
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка при получении токена:', errorText);
      throw new Error(`Ошибка получения токена: ${response.status}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error('❌ Токен отсутствует в ответе:', data);
      throw new Error('Токен отсутствует в ответе');
    }

    accessToken = data.access_token;
    console.log('✅ Токен доступа успешно получен');
    return accessToken;
  } catch (error) {
    console.error('❌ Ошибка при получении токена доступа:', error);
    throw error;
  }
}

async function getRandomBeatmap() {
  console.log('🎲 Начинаем получение случайной карты...');
  
  if (!accessToken) {
    console.log('⚠️ Токен отсутствует, запрашиваем новый...');
    await getAccessToken();
  }

  // Используем более реалистичный диапазон ID карт
  const randomId = Math.floor(Math.random() * 100000) + 1;
  console.log(`🎯 Выбран случайный ID карты: ${randomId}`);
  
  // Используем правильный эндпоинт для получения карты
  const url = new URL(`https://osu.ppy.sh/api/v2/beatmapsets/${randomId}`);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    console.log('📡 Отправляем запрос к API osu!...');
    const response = await fetch(url, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ошибка API: ${response.status} ${response.statusText}`);
      console.error('Детали ошибки:', errorText);
      
      // Если токен истек, пробуем получить новый
      if (response.status === 401) {
        console.log('🔄 Токен истек, запрашиваем новый...');
        await getAccessToken();
        return getRandomBeatmap(); // Рекурсивно пробуем снова
      }

      return null;
    }

    const data = await response.json();
    console.log('📦 Полный ответ от API:', JSON.stringify(data, null, 2));
    
    if (!data || Object.keys(data).length === 0) {
      console.error('❌ Получен пустой ответ от API');
      return null;
    }

    // Выбираем случайную сложность из набора карт
    const difficulties = data.beatmaps || [];
    if (difficulties.length === 0) {
      console.error('❌ В наборе нет сложностей');
      return null;
    }

    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    console.log('🎯 Выбрана случайная сложность:', randomDifficulty.version);
    console.log('📊 Данные сложности:', {
      id: randomDifficulty.id,
      beatmapset_id: randomDifficulty.beatmapset_id,
      version: randomDifficulty.version,
      difficulty_rating: randomDifficulty.difficulty_rating
    });

    const beatmapData = {
      id: randomDifficulty.id,
      beatmapset_id: randomDifficulty.beatmapset_id,
      title: data.title,
      artist: data.artist,
      difficulty_rating: randomDifficulty.difficulty_rating,
      version: randomDifficulty.version,
      creator: data.creator
    };

    console.log('✅ Карта успешно получена:', beatmapData);
    return beatmapData;
  } catch (error) {
    console.error('❌ Ошибка при получении карты:', error);
    getRandomBeatmap()
    return null;
  }
}

app.get('/random-beatmap', async (req, res) => {
  console.log('📥 Получен запрос на случайную карту');
  try {
    const beatmap = await getRandomBeatmap();
    
    if (beatmap) {
      console.log('📤 Отправляем данные карты клиенту:', JSON.stringify(beatmap, null, 2));
      res.json(beatmap);
    } else {
      console.log('❌ Карта не найдена, отправляем ошибку');
      res.status(404).json({ error: 'Карта не найдена' });
    }
  } catch (error) {
    console.error('❌ Ошибка при обработке запроса:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log('📝 Доступные эндпоинты:');
  console.log('   - GET /random-beatmap');
});
