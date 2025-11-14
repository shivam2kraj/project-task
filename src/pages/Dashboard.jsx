import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Brightness4,
  Brightness7,
  CheckCircle,
  Delete,
  Edit,
  Logout,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../lib/api';

const ITEMS_PER_PAGE = 6;

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [authLoading, user, navigate]);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/tasks', {
        params: { page, limit: ITEMS_PER_PAGE },
      });

      const fetchedTasks = response.data.data || [];
      const totalPagesFromResponse = response.data.meta?.totalPages || 0;

      if (page > totalPagesFromResponse && totalPagesFromResponse > 0) {
        setTotalPages(totalPagesFromResponse);
        setPage(totalPagesFromResponse);
        return;
      }

      setTasks(fetchedTasks);
      setTotalPages(Math.max(1, totalPagesFromResponse));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch tasks.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const refreshTasks = () => {
    loadTasks();
  };

  useEffect(() => {
    if (!location.state) return;

    if (location.state.successMessage) {
      setSuccess(location.state.successMessage);
      loadTasks();
    }

    if (location.state.errorMessage) {
      setError(location.state.errorMessage);
    }

    navigate(location.pathname, { replace: true });
  }, [location, navigate, loadTasks]);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timeout);
  }, [success]);

  const handleLogout = () => {
    signOut();
    navigate('/signin');
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setSuccess('Task deleted successfully!');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      refreshTasks();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete task.';
      setError(message);
      setDeleteConfirmOpen(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const canEditTask = (task) => {
    if (!user) return false;
    return task.user_id === user.id || isAdmin();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Manager
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.email}{' '}
              {isAdmin() && <Chip label="Admin" size="small" color="secondary" sx={{ ml: 1 }} />}
            </Typography>
          )}
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            onClick={() => navigate('/tasks/new')}
          >
            Add Task
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Typography>Loading tasks...</Typography>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tasks yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first task to get started
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/tasks/new')}>
                Add Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Grid container spacing={3}>
              {tasks.map((task) => (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ wordBreak: 'break-word', flexGrow: 1 }}>
                          {task.title}
                        </Typography>
                        <Chip
                          icon={task.status === 'completed' ? <CheckCircle /> : <Schedule />}
                          label={task.status}
                          color={task.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {task.description || 'No description'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Created: {formatDate(task.created_at)}
                      </Typography>
                      {task.owner_email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Owner: {task.owner_email}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                      {canEditTask(task) && (
                        <Tooltip title="Edit task">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/tasks/${task.id}/edit`)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isAdmin() && (
                        <Tooltip title="Delete task (Admin only)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(task)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_event, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
