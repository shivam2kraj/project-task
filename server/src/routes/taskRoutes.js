import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

function validateStatus(status) {
  return status === 'pending' || status === 'completed';
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 6;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tasks');

    const [rows] = await pool.query(
      `
        SELECT
          tasks.id,
          tasks.title,
          tasks.description,
          tasks.status,
          tasks.created_at,
          tasks.updated_at,
          tasks.user_id,
          users.email AS owner_email,
          users.role AS owner_role
        FROM tasks
        INNER JOIN users ON users.id = tasks.user_id
        ORDER BY tasks.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    res.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const [rows] = await pool.query(
      `
        SELECT
          tasks.id,
          tasks.title,
          tasks.description,
          tasks.status,
          tasks.created_at,
          tasks.updated_at,
          tasks.user_id,
          users.email AS owner_email
        FROM tasks
        INNER JOIN users ON users.id = tasks.user_id
        WHERE tasks.id = ?
        LIMIT 1
      `,
      [taskId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = rows[0];
    const isOwner = task.user_id === req.user.id;
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: 'You are not allowed to access this task' });
    }

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, status = 'pending' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!validateStatus(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const [result] = await pool.query(
      `
        INSERT INTO tasks (user_id, title, description, status)
        VALUES (?, ?, ?, ?)
      `,
      [req.user.id, title.trim(), description || '', status]
    );

    const [rows] = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          status,
          created_at,
          updated_at,
          user_id
        FROM tasks
        WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const { title, description, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const [existingRows] = await pool.query(
      'SELECT id, user_id FROM tasks WHERE id = ? LIMIT 1',
      [taskId]
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const existingTask = existingRows[0];
    const isOwner = existingTask.user_id === req.user.id;
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: 'You are not allowed to edit this task' });
    }

    await pool.query(
      `
        UPDATE tasks
        SET title = ?, description = ?, status = ?
        WHERE id = ?
      `,
      [title.trim(), description || '', status || 'pending', taskId]
    );

    const [rows] = await pool.query(
      `
        SELECT
          tasks.id,
          tasks.title,
          tasks.description,
          tasks.status,
          tasks.created_at,
          tasks.updated_at,
          tasks.user_id,
          users.email AS owner_email
        FROM tasks
        INNER JOIN users ON users.id = tasks.user_id
        WHERE tasks.id = ?
        LIMIT 1
      `,
      [taskId]
    );

    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

