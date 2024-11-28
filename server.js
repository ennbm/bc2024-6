const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

const NOTES_FILE = './notes.json';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Налаштування Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'A simple API to manage notes',
    },
  },
  apis: ['./server.js'], // шлях до вашого файлу, де є Swagger коментарі
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Додаємо маршрут для Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Функція для читання нотаток з файлу
const readNotesFromFile = () => {
  if (fs.existsSync(NOTES_FILE)) {
    const data = fs.readFileSync(NOTES_FILE);
    return JSON.parse(data);
  }
  return [];
};

// Функція для запису нотаток у файл
const writeNotesToFile = (notes) => {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
};

// Отримання нотатки за ім'ям
/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримання тексту нотатки за її ім'ям
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Текст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.get('/notes/:name', (req, res) => {
  const notes = readNotesFromFile();
  const note = notes.find(n => n.name === req.params.name);
  if (!note) {
    return res.status(404).send('Note not found');
  }
  res.send(note.text);
});

// Оновлення нотатки за ім'ям
/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновлення тексту нотатки
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *       - name: note
 *         in: body
 *         required: true
 *         description: Новий текст нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатка оновлена
 *       404:
 *         description: Нотатка не знайдена
 */
app.put('/notes/:name', (req, res) => {
  const notes = readNotesFromFile();
  const note = notes.find(n => n.name === req.params.name);
  if (!note) {
    return res.status(404).send('Note not found');
  }
  note.text = req.body.note;
  writeNotesToFile(notes);
  res.send('Note updated');
});

// Видалення нотатки за ім'ям
/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалення нотатки за її ім'ям
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатка видалена
 *       404:
 *         description: Нотатка не знайдена
 */
app.delete('/notes/:name', (req, res) => {
  const notes = readNotesFromFile();
  const index = notes.findIndex(n => n.name === req.params.name);
  if (index === -1) {
    return res.status(404).send('Note not found');
  }
  notes.splice(index, 1);
  writeNotesToFile(notes);
  res.send('Note deleted');
});

// Отримання всіх нотаток
/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримання всіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *       200:
 *         description: Немає нотаток
 */
app.get('/notes', (req, res) => {
  const notes = readNotesFromFile();
  if (notes.length === 0) {
    return res.status(200).send('No notes found');
  }

  let notesList = '<h1>Список нотаток:</h1><ul>';
  notes.forEach(note => {
    notesList += `
      <li>
        <strong>${note.name}</strong>: ${note.text}
      </li>
    `;
  });
  notesList += '</ul>';

  res.status(200).send(notesList);
});

// Додавання нової нотатки
/**
 * @swagger
 * /write:
 *   post:
 *     summary: Додавання нової нотатки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Ім'я нотатки
 *               note:
 *                 type: string
 *                 description: Текст нотатки
 *     responses:
 *       201:
 *         description: Нотатка створена
 *       400:
 *         description: Відсутні обов'язкові поля або нотатка вже існує
 */
app.post('/write', upload.none(), (req, res) => {
  const { note_name, note } = req.body;

  if (!note_name || !note) {
    return res.status(400).send('Missing required fields');
  }

  const notes = readNotesFromFile();
  if (notes.some(n => n.name === note_name)) {
    return res.status(400).send('Note already exists');
  }

  notes.push({ name: note_name, text: note });
  writeNotesToFile(notes);
  res.status(201).send('Note created');
});

// Форма для завантаження нотатки
/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Отримання HTML форми для завантаження нотаток
 *     responses:
 *       200:
 *         description: HTML форма
 */
app.get('/UploadForm.html', (req, res) => {
  res.send(`
    <form action="/write" method="POST">
      <label for="note_name">Note Name:</label>
      <input type="text" id="note_name" name="note_name" required><br>

      <label for="note">Note:</label>
      <input type="text" id="note" name="note" required><br>

      <button type="submit">Submit</button>
    </form>
  `);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});


