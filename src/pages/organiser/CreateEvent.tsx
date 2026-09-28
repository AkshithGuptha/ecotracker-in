import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      const dataUrl = await readFileAsDataUrl(file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ data: dataUrl, filename: file.name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.message || 'Upload failed');
      setPhotos(prev => [...prev, data.url]);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed');
    } finally { setUploading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Replace with your actual API call
      const token = localStorage.getItem('token');
      const payload: Record<string, unknown> = { ...formData, maxParticipants: Number(formData.maxParticipants) || 0 };
      if (photos.length > 0) {
        payload.photos = photos;
        payload.image = photos[0];
      }
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Redirect to events list on success
      navigate('/organiser/dashboard');
    } catch (err) {
      console.error('Error creating event:', err);
      // Handle error (e.g., show error message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Event
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                margin="normal"
                required
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date & Time"
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Maximum Participants"
                name="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                margin="normal"
                required
                variant="outlined"
                inputProps={{ min: 1 }}
              />
              <div style={{ marginTop: 12 }}>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                {uploading ? <span style={{ marginLeft: 8 }}>Uploading...</span> : null}
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  {photos.map((p, i) => (<img key={p+i} src={p} alt={`preview-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />))}
                </div>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
