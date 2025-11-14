import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import api from '../lib/api';

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'pending',
};

export default function TaskForm() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const isEdit = Boolean(taskId);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setInitialLoading(false);
      return;
    }

    const loadTask = async () => {
      try {
        setInitialLoading(true);
        const response = await api.get(`/tasks/${taskId}`);
        const task = response.data.data;
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
        });
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message || 'Failed to load task.';
        if (status === 403 || status === 404) {
          navigate('/dashboard', {
            replace: true,
            state: { errorMessage: message },
          });
          return;
        }
        setError(message);
      } finally {
        setInitialLoading(false);
      }
    };

    loadTask();
  }, [isEdit, taskId, navigate]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await api.put(`/tasks/${taskId}`, {
          title: formData.title.trim(),
          description: formData.description,
          status: formData.status,
        });
      } else {
        await api.post('/tasks', {
          title: formData.title.trim(),
          description: formData.description,
          status: formData.status,
        });
      }

      navigate('/dashboard', {
        replace: true,
        state: {
          successMessage: isEdit ? 'Task updated successfully!' : 'Task created successfully!',
        },
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save task.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEdit ? 'Edit Task' : 'Add Task'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isEdit
              ? 'Update the details of your task.'
              : 'Provide details for the task you want to create.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {initialLoading ? (
            <Typography>Loading task...</Typography>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
                margin="normal"
                disabled={loading}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                margin="normal"
                disabled={loading}
              />

              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={handleChange('status')}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<Save />}
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Task' : 'Create Task'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

