import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ----- In-Memory Data -----

let userIdCounter = 4;
const users = [
  { id: 1, email: 'admin@example.com', fullName: 'Администратор', role: 'ADMIN', password: 'admin', avatar: undefined },
  { id: 2, email: 'editor@example.com', fullName: 'Мария Иванова', role: 'EDITOR', password: 'editor', avatar: undefined },
  { id: 3, email: 'observer@example.com', fullName: 'Пётр Сидоров', role: 'OBSERVER', password: 'observer', avatar: undefined },
];

const tokens = {};

let catIdCounter = 6;
const categories = [
  { id: 1, name: 'Java' },
  { id: 2, name: 'SQL' },
  { id: 3, name: 'Алгоритмы' },
  { id: 4, name: 'Spring' },
  { id: 5, name: 'Git' },
];

let tagIdCounter = 5;
const tags = [
  { id: 1, name: 'Core', color: '#1890ff' },
  { id: 2, name: 'OOP', color: '#52c41a' },
  { id: 3, name: 'Collections', color: '#faad14' },
  { id: 4, name: 'Multithreading', color: '#f5222d' },
];

const products = [
  { id: 1, name: 'REDnote' },
  { id: 2, name: 'REDpay' },
  { id: 3, name: 'REDdelivery' },
  { id: 4, name: 'REDadmin' },
];

let qIdCounter = 8;
const questions = [
  { id: 1, text: 'Что такое SOLID?', expectedAnswer: 'Принципы ООП: Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion.', category: categories[1], level: 'MIDDLE', tags: [tags[0], tags[1]], product: null, createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 2, text: 'Расскажите про HashMap', expectedAnswer: 'Структура данных на основе хеш-таблицы. Хранит пары ключ-значение. Разрешает null ключи.', category: categories[0], level: 'JUNIOR', tags: [tags[2]], product: null, createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 3, text: 'Что такое JOIN в SQL?', expectedAnswer: 'Операция соединения таблиц по ключу. Бывает INNER, LEFT, RIGHT, FULL JOIN.', category: categories[1], level: 'JUNIOR', tags: [], product: null, createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 4, text: 'Расскажите про ConcurrentHashMap', expectedAnswer: 'Потокобезопасная версия HashMap. Использует сегментирование для конкурентного доступа.', category: categories[0], level: 'SENIOR', tags: [tags[3]], product: null, createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 5, text: 'Что такое сложность O(log n)?', expectedAnswer: 'Логарифмическая сложность. Пример: бинарный поиск в отсортированном массиве.', category: categories[2], level: 'MIDDLE', tags: [], product: null, createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 6, text: 'Что такое инверсия зависимостей в Spring?', expectedAnswer: 'Dependency Injection — внедрение зависимостей через конструктор, сеттер или поле.', category: categories[3], level: 'MIDDLE', tags: [tags[0]], product: 'REDnote', createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
  { id: 7, text: 'Чем отличается git merge от git rebase?', expectedAnswer: 'Merge создаёт merge-коммит, rebase переписывает историю, накладывая коммиты поверх целевой ветки.', category: categories[4], level: 'MIDDLE', tags: [], product: 'REDpay', createdBy: users[0], createdAt: new Date().toISOString(), archived: false },
];

let interviewIdCounter = 2;
const interviews = [
  { id: 1, candidateName: 'Алексей Смирнов', position: 'Java Developer', level: 'MIDDLE', status: 'PLANNED', interviewer: users[1], topics: [categories[0], categories[1]], createdAt: new Date().toISOString(), completedAt: null },
];

let questionResultIdCounter = 4;
const questionResults = [];

function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(' ')[1];

  // Accept mock tokens for dev — find first admin
  if (token.startsWith('mock-')) {
    req.user = users.find(u => u.role === 'ADMIN') || users[0];
    return next();
  }

  const userId = tokens[token];
  if (!userId) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  req.user = user;
  next();
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function paginate(items, page = 1, size = 20) {
  const total = items.length;
  const start = (page - 1) * size;
  return { items: items.slice(start, start + size), total, page, size };
}

// ----- Auth -----

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  const token = generateToken();
  tokens[token] = user.id;
  res.json({ token, user: sanitizeUser(user) });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(sanitizeUser(req.user));
});

let prodIdCounter = 5;

// ----- Categories -----

app.get('/api/categories', (req, res) => res.json(categories));

app.post('/api/categories', authMiddleware, (req, res) => {
  const cat = { id: catIdCounter++, name: req.body.name };
  categories.push(cat);
  res.status(201).json(cat);
});

app.put('/api/categories/:id', authMiddleware, (req, res) => {
  const cat = categories.find(c => c.id === Number(req.params.id));
  if (!cat) return res.status(404).json({ message: 'Not found' });
  Object.assign(cat, { name: req.body.name });
  res.json(cat);
});

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
  const idx = categories.findIndex(c => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  categories.splice(idx, 1);
  res.status(204).send();
});

// ----- Tags -----

app.get('/api/tags', (req, res) => res.json(tags));

app.post('/api/tags', authMiddleware, (req, res) => {
  const tag = { id: tagIdCounter++, ...req.body };
  tags.push(tag);
  res.status(201).json(tag);
});

app.put('/api/tags/:id', authMiddleware, (req, res) => {
  const tag = tags.find(t => t.id === Number(req.params.id));
  if (!tag) return res.status(404).json({ message: 'Not found' });
  Object.assign(tag, req.body);
  res.json(tag);
});

app.delete('/api/tags/:id', authMiddleware, (req, res) => {
  const idx = tags.findIndex(t => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  tags.splice(idx, 1);
  res.status(204).send();
});

app.get('/api/products', (req, res) => res.json(products));

app.post('/api/products', authMiddleware, (req, res) => {
  const prod = { id: prodIdCounter++, name: req.body.name };
  products.push(prod);
  res.status(201).json(prod);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const prod = products.find(p => p.id === Number(req.params.id));
  if (!prod) return res.status(404).json({ message: 'Not found' });
  Object.assign(prod, { name: req.body.name });
  res.json(prod);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const idx = products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  products.splice(idx, 1);
  res.status(204).send();
});

// ----- Users (ADMIN only) -----

app.get('/api/users', authMiddleware, (req, res) => {
  const page = Number(req.query.page) || 1;
  const size = Number(req.query.size) || 20;
  res.json(paginate(users.map(sanitizeUser), page, size));
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(sanitizeUser(user));
});

app.post('/api/users', authMiddleware, (req, res) => {
  const user = { id: userIdCounter++, ...req.body, avatar: undefined };
  users.push(user);
  res.status(201).json(sanitizeUser(user));
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'Not found' });
  Object.assign(user, req.body);
  res.json(sanitizeUser(user));
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const idx = users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  users.splice(idx, 1);
  res.status(204).send();
});

// ----- Questions -----

app.get('/api/questions', (req, res) => {
  const page = Number(req.query.page) || 1;
  const size = Number(req.query.size) || 20;
  let filtered = questions.filter(q => !q.archived);

  if (req.query.categoryId) filtered = filtered.filter(q => q.category.id === Number(req.query.categoryId));
  if (req.query.level) filtered = filtered.filter(q => q.level === req.query.level);
  if (req.query.text) filtered = filtered.filter(q => q.text.toLowerCase().includes(req.query.text.toLowerCase()));
  if (req.query.tagIds) {
    const ids = String(req.query.tagIds).split(',').map(Number);
    filtered = filtered.filter(q => q.tags.some(t => ids.includes(t.id)));
  }
  if (req.query.product) filtered = filtered.filter(q => q.product === req.query.product);

  res.json(paginate(filtered, page, size));
});

app.get('/api/questions/:id', (req, res) => {
  const q = questions.find(q => q.id === Number(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  res.json(q);
});

app.post('/api/questions', authMiddleware, (req, res) => {
  const { text, expectedAnswer, categoryId, level, tagIds = [], product } = req.body;
  const q = {
    id: qIdCounter++, text, expectedAnswer,
    category: categories.find(c => c.id === categoryId) || categories[0],
    level: level || null,
    tags: tags.filter(t => tagIds.includes(t.id)),
    product: product || null,
    createdBy: sanitizeUser(req.user),
    createdAt: new Date().toISOString(),
    archived: false,
  };
  questions.push(q);
  res.status(201).json(q);
});

app.put('/api/questions/:id', authMiddleware, (req, res) => {
  const q = questions.find(q => q.id === Number(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  const { text, expectedAnswer, categoryId, level, tagIds = [], product } = req.body;
  Object.assign(q, {
    text, expectedAnswer,
    category: categories.find(c => c.id === categoryId) || q.category,
    level: level ?? q.level,
    tags: tags.filter(t => tagIds.includes(t.id)),
    product: product ?? q.product,
  });
  res.json(q);
});

app.patch('/api/questions/:id/archive', authMiddleware, (req, res) => {
  const q = questions.find(q => q.id === Number(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  q.archived = true;
  res.status(204).send();
});

app.patch('/api/questions/:id/restore', authMiddleware, (req, res) => {
  const q = questions.find(q => q.id === Number(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  q.archived = false;
  res.status(204).send();
});

app.delete('/api/questions/:id', authMiddleware, (req, res) => {
  const idx = questions.findIndex(q => q.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  questions.splice(idx, 1);
  res.status(204).send();
});

app.post('/api/questions/generate', authMiddleware, (req, res) => {
  const { categoryId, level, count = 3 } = req.body;
  const category = categories.find(c => c.id === categoryId);
  const generated = Array.from({ length: count }, (_, i) => ({
    id: qIdCounter++, text: `Сгенерированный вопрос ${i + 1}`,
    expectedAnswer: `Ответ на вопрос ${i + 1}`,
    category: category || categories[0], level: level || 'MIDDLE', tags: [],
    product: null, createdBy: sanitizeUser(req.user), createdAt: new Date().toISOString(), archived: false,
  }));
  res.json(generated);
});

app.post('/api/questions/generate/save', authMiddleware, (req, res) => {
  const created = req.body.map(qData => {
    const q = { id: qIdCounter++, ...qData, createdAt: new Date().toISOString(), archived: false };
    questions.push(q);
    return q;
  });
  res.status(201).json(created);
});

app.get('/api/questions/:id/answer', (req, res) => {
  const q = questions.find(q => q.id === Number(req.params.id));
  if (!q) return res.status(404).json({ message: 'Not found' });
  res.json({ expectedAnswer: q.expectedAnswer });
});

// ----- Interviews -----

app.post('/api/interviews', authMiddleware, (req, res) => {
  const { candidateName, position, level, questionIds = [] } = req.body;
  const selectedQuestions = questions.filter(q => questionIds.includes(q.id));

  const interview = {
    id: interviewIdCounter++, candidateName, position, level, status: 'PLANNED',
    interviewer: sanitizeUser(req.user), topics: selectedTopics,
    createdAt: new Date().toISOString(), completedAt: null,
  };
  interviews.push(interview);

  // Create QuestionResults for each selected question
  selectedQuestions.forEach(q => {
    questionResults.push({
      id: questionResultIdCounter++, interviewId: interview.id, questionId: q.id,
      question: q, score: null, comment: null, askedAt: null,
    });
  });

  // Change status to IN_PROGRESS
  interview.status = 'IN_PROGRESS';

  res.status(201).json(interview);
});

app.get('/api/interviews', authMiddleware, (req, res) => {
  const page = Number(req.query.page) || 1;
  const size = Number(req.query.size) || 20;
  let filtered = [...interviews];

  if (req.query.candidateName) filtered = filtered.filter(i => i.candidateName.toLowerCase().includes(req.query.candidateName.toLowerCase()));
  if (req.query.level) filtered = filtered.filter(i => i.level === req.query.level);
  if (req.query.status) filtered = filtered.filter(i => i.status === req.query.status);
  if (req.query.fromDate) filtered = filtered.filter(i => new Date(i.createdAt) >= new Date(req.query.fromDate));
  if (req.query.toDate) filtered = filtered.filter(i => new Date(i.createdAt) <= new Date(req.query.toDate));

  if (req.query.sort) {
    const [field, dir] = req.query.sort.split(',');
    filtered.sort((a, b) => {
      const cmp = String(a[field] || '').localeCompare(String(b[field] || ''));
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  res.json(paginate(filtered, page, size));
});

app.get('/api/interviews/dashboard', authMiddleware, (req, res) => {
  const totalInterviews = interviews.length;
  const totalQuestions = questions.length;

  const rolesCount = {};
  users.forEach(u => { rolesCount[u.role] = (rolesCount[u.role] || 0) + 1; });
  const usersByRole = Object.entries(rolesCount).map(([role, count]) => ({ role, count }));

  const interviewsByStatus = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'].map(status => ({
    status,
    count: interviews.filter(i => i.status === status).length,
  }));

  res.json({ totalInterviews, totalQuestions, usersByRole, interviewsByStatus, recentInterviews: [...interviews].slice(-5).reverse() });
});

app.get('/api/interviews/:id', authMiddleware, (req, res) => {
  const interview = interviews.find(i => i.id === Number(req.params.id));
  if (!interview) return res.status(404).json({ message: 'Not found' });
  res.json(interview);
});

app.get('/api/interviews/:id/questions', authMiddleware, (req, res) => {
  const results = questionResults.filter(r => r.interviewId === Number(req.params.id));
  res.json(results);
});

app.post('/api/interviews/:id/questions/:questionId/rate', authMiddleware, (req, res) => {
  const interviewId = Number(req.params.id);
  const questionId = Number(req.params.questionId);
  const { score, comment } = req.body;

  let result = questionResults.find(r => r.interviewId === interviewId && r.questionId === questionId);
  if (result) {
    result.score = score;
    result.comment = comment || null;
  } else {
    const question = questions.find(q => q.id === questionId);
    result = {
      id: questionResultIdCounter++, interviewId, questionId,
      question: question, score, comment: comment || null,
      askedAt: new Date().toISOString(),
    };
    questionResults.push(result);
  }
  res.json(result);
});

app.get('/api/interviews/:id/result', authMiddleware, (req, res) => {
  const results = questionResults.filter(r => r.interviewId === Number(req.params.id));
  const scores = results.filter(r => r.score !== null).map(r => r.score);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const averageScore = scores.length ? totalScore / scores.length : 0;
  let finalGrade = 'N/A';
  if (averageScore >= 8) finalGrade = 'Отлично';
  else if (averageScore >= 6) finalGrade = 'Хорошо';
  else if (averageScore >= 4) finalGrade = 'Удовлетворительно';
  else if (averageScore > 0) finalGrade = 'Плохо';

  res.json({ totalScore, averageScore, finalGrade });
});

app.get('/api/interviews/:id/report', authMiddleware, (req, res) => {
  const interview = interviews.find(i => i.id === Number(req.params.id));
  if (!interview) return res.status(404).json({ message: 'Not found' });

  const results = questionResults.filter(r => r.interviewId === Number(req.params.id));
  const scores = results.filter(r => r.score !== null).map(r => r.score);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const averageScore = scores.length ? totalScore / scores.length : 0;
  let finalGrade = 'N/A';
  if (averageScore >= 8) finalGrade = 'Отлично';
  else if (averageScore >= 6) finalGrade = 'Хорошо';
  else if (averageScore >= 4) finalGrade = 'Удовлетворительно';
  else if (averageScore > 0) finalGrade = 'Плохо';

  res.json({
    candidateName: interview.candidateName, position: interview.position,
    level: interview.level, interviewDate: interview.createdAt,
    interviewer: interview.interviewer, results,
    totalScore, averageScore, finalGrade, reportDate: new Date().toISOString(),
  });
});

app.post('/api/interviews/:id/complete', authMiddleware, (req, res) => {
  const interview = interviews.find(i => i.id === Number(req.params.id));
  if (!interview) return res.status(404).json({ message: 'Not found' });
  interview.status = 'COMPLETED';
  interview.completedAt = new Date().toISOString();
  res.status(204).send();
});

// ----- Start -----

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Mock server v2 running on http://localhost:${PORT}`);
  console.log('');
  console.log('Доступные пользователи:');
  console.log('  admin@example.com / admin (ADMIN)');
  console.log('  editor@example.com / editor (EDITOR)');
  console.log('  observer@example.com / observer (OBSERVER)');
});
