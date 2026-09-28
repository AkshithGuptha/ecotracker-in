import { SxProps, Theme } from '@mui/material';

// For NGO Dashboard
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// For Material-UI components with custom props
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
  }
}

// For the NGO product interface
interface NgoProduct {
  _id: string;
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  category: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

// For the NGO user interface
interface NgoUser {
  _id: string;
  organizationName: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  registrationNumber: string;
  website: string;
  logo?: string;
  description?: string;
  products?: NgoProduct[];
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// For form data types
type NgoRegisterFormData = {
  organizationName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  registrationNumber: string;
  website: string;
};

type NgoLoginFormData = {
  email: string;
  password: string;
};

type ProductFormData = {
  name: string;
  description: string;
  pointsRequired: number;
  quantity: number;
  category: string;
  image: string;
};

// For API response types
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// For theme customization
declare module '@mui/material/styles' {
  interface Theme {
    customShadows: {
      card: string;
      dialog: string;
    };
  }
  // Allow configuration using `createTheme`
  interface ThemeOptions {
    customShadows?: {
      card?: string;
      dialog?: string;
    };
  }
}

// For React components with children
interface ChildrenProps {
  children: React.ReactNode;
}

// For protected route props
interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}
