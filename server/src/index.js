const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 根据环境加载配置
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 配置 CORS
const corsOptions = {
  origin: ['http://80905r04y1.zicp.fun', 'http://80905r04y1.zicp.fun:5173', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

// 连接数据库
const dbPath = path.join(__dirname, '../database/todos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('成功连接到数据库，路径:', dbPath);
    
    // 创建用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建用户表失败:', err.message);
      } else {
        console.log('用户表检查/创建成功');
      }
    });

    // 创建todos表，添加user_id外键
    db.run(`CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
      deadline TEXT,
      completedAt TEXT,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('创建表失败:', err.message);
      } else {
        console.log('数据库表检查/创建成功');
      }
    });
  }
});

// 中间件：验证JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '登录已过期' });
    }
    req.user = user;
    next();
  });
};

// 用户注册
app.post('/api/register', async (req, res) => {
  const { account, password, username } = req.body;

  if (!account || !password || !username) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }

  try {
    // 检查账号是否已存在
    db.get('SELECT id FROM users WHERE account = ?', [account], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row) {
        return res.status(400).json({ error: '账号已存在' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建新用户
      db.run('INSERT INTO users (account, password, username) VALUES (?, ?, ?)',
        [account, hashedPassword, username],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const token = jwt.sign({ id: this.lastID, account, username }, JWT_SECRET, { expiresIn: '24h' });
          res.json({
            token,
            user: { id: this.lastID, account, username }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ error: '账号和密码都是必填的' });
  }

  try {
    db.get('SELECT * FROM users WHERE account = ?', [account], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(401).json({ error: '账号不存在' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: '密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, account: user.account, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, account: user.account, username: user.username }
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户名
app.put('/api/users/username', authenticateToken, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.id;

  if (!username) {
    return res.status(400).json({ error: '用户名是必填的' });
  }

  db.run('UPDATE users SET username = ? WHERE id = ?', [username, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const token = jwt.sign(
      { id: userId, account: req.user.account, username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, username });
  });
});

// 获取所有待办事项（需要认证）
app.get('/api/todos', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM todos WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 添加待办事项（需要认证）
app.post('/api/todos', authenticateToken, (req, res) => {
  const { text, priority, deadline } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: '任务文本不能为空' });
  }

  const sql = 'INSERT INTO todos (text, priority, deadline, user_id) VALUES (?, ?, ?, ?)';
  const params = [text.trim(), priority || 'medium', deadline || null, userId];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// 更新待办事项（需要认证）
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const { text, completed, priority, deadline, completedAt } = req.body;
  const userId = req.user.id;
  const todoId = req.params.id;

  // 首先验证该待办事项属于当前用户
  db.get('SELECT id FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '待办事项不存在或无权访问' });
    }

    const sql = `
      UPDATE todos 
      SET text = ?, completed = ?, priority = ?, deadline = ?, completedAt = ?
      WHERE id = ? AND user_id = ?
    `;
    
    db.run(sql, [text, completed ? 1 : 0, priority, deadline, completedAt, todoId, userId], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '更新成功' });
    });
  });
});

// 删除待办事项（需要认证）
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const todoId = req.params.id;

  // 首先验证该待办事项属于当前用户
  db.get('SELECT id FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '待办事项不存在或无权访问' });
    }

    db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '删除成功' });
    });
  });
});

// 修改服务器启动
app.listen(port, host, () => {
  console.log(`服务器运行在 http://${host}:${port}`);
}); 