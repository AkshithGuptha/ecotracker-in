import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper, 
  Box, 
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoginFormData {
  email: string;
  password: string;
}

export default function NgoLogin() {
  const theme = useTheme();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/ngo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      if (!data.token || !data.ngo) {
        throw new Error('Invalid response from server');
      }

      // Save token and redirect to NGO dashboard
      localStorage.setItem('ngoToken', data.token);
      localStorage.setItem('ngo', JSON.stringify(data.ngo));
      navigate('/ngo/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          NGO Login
        </Typography>
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2,
              py: 1.5,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/ngo/register" variant="body2">
              Don't have an account? Sign Up
            </MuiLink>
          </Box>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/login" variant="body2">
              Back to User Login
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
