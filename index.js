const express = require('express');
const cors = require('cors');
const app = express();
const port = 30333;

let clients = [];
let latestFrame = null;

// Настройка CORS - разрешаем запросы от камеры (можно заменить '*' на конкретный домен/адрес)
app.use(cors({
  origin: '*', // или укажите IP/домен камеры, например 'http://камера:порт'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));

// Для обработки OPTIONS-запросов (preflight)
app.options('*', cors());

// Приём JPEG кадров с камеры
app.post('/upload', express.raw({ type: 'image/jpeg', limit: '5mb' }), (req, res) => {
  latestFrame = req.body;

  // Раздаём полученный кадр всем клиентам
  clients.forEach(clientRes => {
    clientRes.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-length: ${latestFrame.length}\r\n\r\n`);
    clientRes.write(latestFrame);
    clientRes.write('\r\n');
  });
  res.sendStatus(200);
});

// Трансляция MJPEG потока для всех клиентов по GET /stream
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });
  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

Простая страница для просмотра трансляции
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h2>Видеотрансляция с удалённой камеры</h2>
         <img src="/stream" style="max-width: 100%">
      </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h2>+++Видеотрансляция с удалённой камеры+++</h2>
         
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Сервер запущен http://85.28.47.165:${port}`);
});