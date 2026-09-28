import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserRole } from '@/lib/auth';
import { UserRole } from '@/lib/auth';
import { Button, Card, CardContent, CardHeader, Container, Grid, Typography, Box } from '@mui/material';
import {
  Person as UserIcon,
  Groups as NgoIcon,
  Event as OrganizerIcon
} from '@mui/icons-material';

const roleOptions: {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  route: string;
}[] = [
  {
    id: 'user',
    title: 'Regular User',
    description: 'Join events, track your carbon footprint, and earn rewards.',
    icon: <UserIcon fontSize="large" color="primary" />,
    buttonText: 'Continue as User',
    route: '/dashboard'
  },
  {
    id: 'ngo',
    title: 'NGO',
    description: 'Manage your organization, create campaigns, and engage with volunteers.',
    icon: <NgoIcon fontSize="large" color="primary" />,
    buttonText: 'Continue as NGO',
    route: '/ngo/dashboard'
  },
  {
    id: 'organizer',
    title: 'Event Organizer',
    description: 'Create and manage events, track attendance, and engage with participants.',
    icon: <OrganizerIcon fontSize="large" color="primary" />,
    buttonText: 'Continue as Organizer',
    route: '/organiser/dashboard'
  },
];

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as any)?.from?.pathname || '/';

  const handleRoleSelect = async (role: UserRole, route: string) => {
    try {
      setIsSubmitting(true);
      // In a real app, you would make an API call to update the user's role
      // await updateUserRole(role);
      
      // For now, just update the local storage
      setUserRole(role);
      
      // Redirect to the intended URL or the role's default route
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to EcoConnect!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Please select your role to continue
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {roleOptions.map((role) => (
          <Grid item xs={12} sm={6} md={4} key={role.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardHeader 
                title={role.title} 
                avatar={role.icon}
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {role.description}
                </Typography>
              </CardContent>
              <Box p={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleRoleSelect(role.id, role.route)}
                  disabled={isSubmitting}
                >
                  {role.buttonText}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default SelectRole;
