
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Search, Recycle, ShoppingBag, Users, QrCode, Star, Navigation, Plus, Loader2, Clock, CheckCircle, Share2, Trash2, Compass, Crosshair } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, getCurrentUserId, signInAsAnonymous } from "@/lib/firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import L, { Icon, LatLngExpression, divIcon } from 'leaflet';
// Fix default marker icon paths for bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
import 'leaflet/dist/leaflet.css';
import { EcoPin } from "@/types/ecoPin";
import './EcoMap.css';

// Fix for Leaflet icon issue in webpack
// This is needed because Leaflet's default icon paths are challenged by webpack
const customIcon = (type: string) => {
  let iconUrl;
  let iconColor;

  switch (type) {
    case 'ewaste':
      iconColor = '#10b981'; // green
      break;
    case 'shops':
      iconColor = '#3b82f6'; // blue
      break;
    case 'ngos':
      iconColor = '#8b5cf6'; // purple
      break;
    default:
      iconColor = '#6b7280'; // gray
  }

  // Create modern SVG icon with gradient and pulse effect as data URL
  iconUrl = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
      <defs>
        <radialGradient id="shadow" cx="50%" cy="100%" r="50%" fx="50%" fy="100%">
          <stop offset="0%" stop-color="#000" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="gradient-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${iconColor}" />
          <stop offset="100%" stop-color="${iconColor === '#10b981' ? '#059669' : 
                                            iconColor === '#3b82f6' ? '#2563eb' : 
                                            iconColor === '#8b5cf6' ? '#7c3aed' : '#4b5563'}" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <ellipse cx="24" cy="44" rx="8" ry="3" fill="url(#shadow)" opacity="0.3" />
      <g filter="url(#glow)">
        <path d="M24 4C17.4 4 12 9.4 12 16c0 10.5 12 25 12 25s12-14.5 12-25c0-6.6-5.4-12-12-12z" fill="url(#gradient-${type})" />
        <circle cx="24" cy="16" r="5" fill="white" fill-opacity="0.5" />
      </g>
    </svg>
  `)}`;

  return new Icon({
    iconUrl,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
    className: 'pulse-marker'
  });
};

// Map click handler component
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// User location component
const UserLocationMarker = ({ 
  position, 
  accuracy
}: { 
  position: { lat: number, lng: number },
  accuracy: number
}) => {
  // Create a custom div icon for user location
  const userIcon = divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg pulse-animation flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>
    `
  });

  // Update the map center to user's location
  const map = useMap();
  
  // When position changes, fly to the user's location
  useEffect(() => {
    if (position && map) {
      map.flyTo([position.lat, position.lng], map.getZoom(), {
        animate: true,
        duration: 1
      });
    }
  }, [position, map]);

  return (
    <>
      {/* Accuracy circle */}
      <Circle {...({ center: [position.lat, position.lng], radius: accuracy, pathOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1, opacity: 0.5, dashArray: '5, 5' } } as any)} />
      {/* User position marker */}
      <Marker 
        position={[position.lat, position.lng]} 
        icon={userIcon as any}
      >
        <Popup>
          <div className="text-center">
            <p className="font-medium">Your Location</p>
            <p className="text-xs text-gray-500">Accuracy: ~{Math.round(accuracy)} meters</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

const EcoMap = () => {
  const [user, userLoading, userError] = useAuthState(auth);
  const [userId, setUserId] = useState<string>('anonymous');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState<EcoPin | null>(null);
  const [ecoPins, setEcoPins] = useState<EcoPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [zoom, setZoom] = useState(13);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{lat: number, lng: number} | null>(null);
  const [newPinData, setNewPinData] = useState<Partial<EcoPin>>({
    title: '',
    description: '',
    type: 'other',
    address: '',
    hours: '',
    phone: '',
    rating: 0,
    points: 5,
    verified: false
  });
  
  // Geolocation states
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  
  const categories = [
    { id: "all", name: "All Locations", icon: MapPin },
    { id: "ewaste", name: "E-waste Centers", icon: Recycle },
    { id: "shops", name: "Eco Shops", icon: ShoppingBag },
    { id: "ngos", name: "NGOs", icon: Users }
  ];
  
  // Function to locate the user
  const locateUser = () => {
    setIsLocatingUser(true);
    setGeolocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationAccuracy(accuracy);
          setIsLocatingUser(false);
          
          // Center map on user location
          if (mapRef.current) {
            const map = mapRef.current;
            map.flyTo([latitude, longitude], 15, {
              animate: true,
              duration: 1.5
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocatingUser(false);
          
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access was denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out";
              break;
            default:
              errorMessage = "An unknown error occurred";
          }
          setGeolocationError(errorMessage);
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 
        }
      );
    } else {
      setGeolocationError("Geolocation is not supported by your browser");
      setIsLocatingUser(false);
    }
  };

  // Check for mock authentication on initial load
  useEffect(() => {
    const isMockSignedIn = localStorage.getItem('is_mock_signed_in') === 'true';
    const mockUserId = localStorage.getItem('mock_user_id');
    
    if (isMockSignedIn && mockUserId) {
      setUserId(mockUserId);
      console.log("Mock user found on initial load:", mockUserId);
    }
  }, []);

  // Get user's location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        setIsLocatingUser(true);
        setGeolocationError(null);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            // Set map center to user location
            setMapCenter([latitude, longitude]);
            // Store user location and accuracy for the marker and circle
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationAccuracy(accuracy);
            setIsLocatingUser(false);
            
            // If map reference is available, fly to user location
            if (mapRef.current) {
              const map = mapRef.current;
              map.flyTo([latitude, longitude], 15, {
                animate: true,
                duration: 1.5
              });
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLocatingUser(false);
            
            let errorMessage;
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location access was denied by the user";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable";
                break;
              case error.TIMEOUT:
                errorMessage = "The request to get user location timed out";
                break;
              default:
                errorMessage = "An unknown error occurred";
            }
            setGeolocationError(errorMessage);
          },
          // Options for geolocation
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      } else {
        setGeolocationError("Geolocation is not supported by your browser");
      }
    };
    
    getUserLocation();
  }, []);
  
  // Update userId when user authentication state changes
  useEffect(() => {
    // Check for our mock authentication first
    const isMockSignedIn = localStorage.getItem('is_mock_signed_in') === 'true';
    const mockUserId = localStorage.getItem('mock_user_id');
    
    if (isMockSignedIn && mockUserId) {
      setUserId(mockUserId);
      console.log("Mock user authenticated successfully:", mockUserId);
      return;
    }
    
    // Otherwise use Firebase authentication
    if (!userLoading) {
      if (user) {
        const uid = user.uid;
        setUserId(uid);
        console.log("User authenticated successfully:", uid);
        console.log("User info:", {
          email: user.email,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous
        });
      } else {
        setUserId('anonymous');
        console.log("No authenticated user");
      }
    }
  }, [user, userLoading]);

  // Set up Firestore listener for eco-pins
  useEffect(() => {
    setIsLoading(true);
    const ecoPinsRef = collection(db, 'eco-pins');
    
    const unsubscribe = onSnapshot(ecoPinsRef, (snapshot) => {
      const pinsData: EcoPin[] = [];
      
      snapshot.forEach((doc) => {
        pinsData.push({
          id: doc.id,
          ...doc.data() as Omit<EcoPin, 'id'>
        });
      });
      
      setEcoPins(pinsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching eco pins:", error);
      setIsLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Handle adding a new pin
  const handleMapClick = (lat: number, lng: number) => {
    // Check both the Firebase auth state and our mock auth state
    const isMockSignedIn = localStorage.getItem('is_mock_signed_in') === 'true';
    
    if (!user && !isMockSignedIn) {
      alert("Please sign in to add new locations to the map");
      return;
    }
    
    // For debugging
    console.log("User authenticated:", user ? user.uid : (isMockSignedIn ? 'mock user' : 'none'));
    
    // Try to get address from reverse geocoding
    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      } catch (error) {
        console.error("Error reverse geocoding:", error);
      }
      return '';
    };
    
    // Set the new pin location
    setNewPinLocation({ lat, lng });
    
    // Try to get the address before opening the dialog
    reverseGeocode(lat, lng)
      .then(address => {
        setNewPinData(prev => ({
          ...prev,
          address: address || ''
        }));
        setIsAddingPin(true);
      })
      .catch(() => {
        // If geocoding fails, just open the dialog without an address
        setIsAddingPin(true);
      });
  };

  // Add a new pin to Firestore
  const handleAddPin = async () => {
    // Check both Firebase auth and mock auth
    const isMockSignedIn = localStorage.getItem('is_mock_signed_in') === 'true';
    if (!newPinLocation || (!user && !isMockSignedIn)) return;
    
    try {
      // Validate form inputs
      if (!newPinData.title) {
        alert("Please enter a name for the location");
        return;
      }
      
      if (!newPinData.description) {
        alert("Please enter a description for the location");
        return;
      }
      
      const newPin: Omit<EcoPin, 'id'> = {
        latitude: newPinLocation.lat,
        longitude: newPinLocation.lng,
        title: newPinData.title || "Unnamed Location",
        description: newPinData.description || "No description provided",
        type: newPinData.type as 'ewaste' | 'shops' | 'ngos' | 'other',
        userId: userId, // Use the userId state instead of getCurrentUserId()
        createdAt: serverTimestamp(),
        points: newPinData.points || 5,
        rating: newPinData.rating || 0,
        address: newPinData.address || '',
        phone: newPinData.phone || '',
        hours: newPinData.hours || '',
        verified: false,
        visitors: Math.floor(Math.random() * 50) + 1 // Random visitors count
      };
      
      // Add the new pin to Firestore
      const docRef = await addDoc(collection(db, 'eco-pins'), newPin);
      console.log("Document written with ID: ", docRef.id);
      
      // Reset form but don't clear the location, allowing the user to add multiple pins
      setNewPinData({
        title: '',
        description: '',
        type: 'other',
        address: '',
        hours: '',
        phone: '',
        rating: 0,
        points: 5,
        verified: false
      });
      
      // Show a success message with more details
      const successMessage = `${newPin.title} has been added to the map! You earned ${newPin.points} eco points. You can add more locations.`;
      alert(successMessage);
      
      // Close the dialog but keep the selected location
      setIsAddingPin(false);
      
      // Optionally select the newly added pin to show details
      const newlyAddedPin: EcoPin = {
        ...newPin,
        id: docRef.id
      };
      setSelectedLocation(newlyAddedPin);
      
    } catch (error) {
      console.error("Error adding pin:", error);
      alert("Failed to add new location. Please try again.");
    }
  };

  // Delete a pin
  const handleDeletePin = async (pinId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'eco-pins', pinId));
      if (selectedLocation?.id === pinId) {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error("Error deleting pin:", error);
    }
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  // Format distance for display
  const getFormattedDistance = (pin: EcoPin) => {
    // Use user's current location if available, otherwise use map center
    if (userLocation) {
      return calculateDistance(userLocation.lat, userLocation.lng, pin.latitude, pin.longitude);
    } else if (mapCenter) {
      return calculateDistance(mapCenter[0], mapCenter[1], pin.latitude, pin.longitude);
    }
    return 'Unknown distance';
  };

  // State for proximity filter (5km radius toggle)
  const [showNearbyOnly, setShowNearbyOnly] = useState<boolean>(false);
  
  // Apply filters for displaying locations
  const filteredLocations = ecoPins
    .filter(location => {
      // Filter by category
      const matchesCategory = selectedCategory === "all" || location.type === selectedCategory;
      
      // Filter by search query - more comprehensive search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' || // if empty query, show all
        location.title.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query) ||
        (location.address && location.address.toLowerCase().includes(query)) ||
        location.type.toLowerCase().includes(query);
      
      // Filter by proximity - within 5km radius of user's location
      let isNearby = true; // Default to show all if no user location or filter is off
      
      if (userLocation && showNearbyOnly) {
        const distanceInKm = calculateDistanceRaw(
          userLocation.lat,
          userLocation.lng,
          location.latitude,
          location.longitude
        );
        
        isNearby = distanceInKm <= 5; // 5km radius
      }
      
      return matchesCategory && matchesSearch && isNearby;
    })
    // Sort by proximity to user if user location is available, otherwise by creation date
    .sort((a, b) => {
      // If user location is available, sort by distance
      if (userLocation) {
        const distanceA = calculateDistanceRaw(
          userLocation.lat, 
          userLocation.lng, 
          a.latitude, 
          a.longitude
        );
        const distanceB = calculateDistanceRaw(
          userLocation.lat, 
          userLocation.lng, 
          b.latitude, 
          b.longitude
        );
        
        return distanceA - distanceB;
      }
      
      // Otherwise sort by creation date (newest first) if available
      if (a.createdAt && b.createdAt) {
        // Firebase Timestamp objects
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      
      return 0;
    });
    
  // Helper function to calculate raw distance (no formatting) for sorting
  const calculateDistanceRaw = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };
  
  // Helper function to check if a location is within 5km radius
  const isWithin5km = (location: EcoPin): boolean => {
    if (!userLocation) return true; // Show all if no user location
    
    const distance = calculateDistanceRaw(
      userLocation.lat,
      userLocation.lng,
      location.latitude,
      location.longitude
    );
    
    return distance <= 5; // 5km radius
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ewaste": return <Recycle className="h-5 w-5 text-green-600" />;
      case "shops": return <ShoppingBag className="h-5 w-5 text-blue-600" />;
      case "ngos": return <Users className="h-5 w-5 text-purple-600" />;
      default: return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Helper to get location type color for the banner
  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case "ewaste": return 'bg-gradient-to-r from-emerald-500 to-green-400';
      case "shops": return 'bg-gradient-to-r from-blue-500 to-cyan-400';
      case "ngos": return 'bg-gradient-to-r from-purple-500 to-violet-400';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-400';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ewaste": return <Badge className="bg-green-100 text-green-800">E-waste Center</Badge>;
      case "shops": return <Badge className="bg-blue-100 text-blue-800">Eco Shop</Badge>;
      case "ngos": return <Badge className="bg-purple-100 text-purple-800">NGO</Badge>;
      default: return <Badge variant="outline">Location</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <MapPin className="h-10 w-10 text-emerald-600 mr-2" />
            <h1 className="text-4xl font-extrabold text-emerald-800 tracking-tight">
              EcoMap
            </h1>
          </div>
          <p className="text-lg text-emerald-700/80 max-w-2xl mx-auto">
            Discover and contribute to a network of eco-friendly locations in your community
          </p>
        </div>
        
        <div className="flex items-center justify-between bg-emerald-50/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-emerald-100">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Explore eco-friendly locations and contribute to a sustainable future
            </p>
          </div>
          
          {user && (
            <div className="flex items-center">
              <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-medium rounded-full">
                Contributor: {user.email?.split('@')[0]}
              </Badge>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-md border border-emerald-100">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-500" />
            <Input
              placeholder="Search for eco-friendly locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery(''); // Clear search on Escape
                }
              }}
              className={`pl-12 py-6 rounded-full border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300 text-emerald-900 transition-all duration-200 ${searchQuery ? 'pr-10 border-emerald-400' : ''}`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-500 hover:text-emerald-700"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex space-x-2 overflow-x-auto py-1 px-1">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 whitespace-nowrap rounded-full ${
                    selectedCategory === category.id 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-md" 
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
            
            {/* Nearby filter toggle button */}
            {userLocation && (
              <Button
                variant={showNearbyOnly ? "default" : "outline"}
                onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                className={`flex items-center space-x-2 whitespace-nowrap rounded-full ml-2 ${
                  showNearbyOnly 
                    ? "bg-blue-600 hover:bg-blue-700 shadow-md" 
                    : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Within 5km</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Map - Takes up 2/3 of screen on large devices */}
          <div className="lg:col-span-2">
          {/* Interactive Map */}
          <Card className="relative shadow-xl border-0 bg-gradient-to-br from-white to-green-50 overflow-hidden">
            <CardHeader className="pb-0 bg-transparent">
              <CardTitle className="flex justify-between items-center text-2xl font-bold text-emerald-800">
                <div className="flex items-center gap-2">
                  <span>Interactive Map</span>
                  {userLocation && (
                    <Badge className="bg-blue-100 text-blue-700 ml-2">
                      <Compass className="h-3.5 w-3.5 mr-1" /> Location Active
                    </Badge>
                  )}
                </div>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
              </CardTitle>
              <CardDescription className="flex items-center justify-between text-emerald-700/70">
                <span>Click on the map to add new eco-friendly locations</span>
                {userLocation && (
                  <span className="text-blue-600 text-xs flex items-center">
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    Showing locations near you
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 h-[70vh]">
              <div className="w-full h-full rounded-xl overflow-hidden border border-emerald-200 shadow-inner map-container">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent pointer-events-none"></div>
                <MapContainer
                  center={mapCenter as LatLngExpression}
                  zoom={zoom}
                  style={{ width: '100%', height: '100%' }}
                  whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
                  className="z-10"
                >
                  <TileLayer {...({ attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' } as any)} />
                  
                  {/* Existing markers from Firestore */}
                  {filteredLocations.map(pin => (
                    <Marker
                      key={pin.id}
                      position={[pin.latitude, pin.longitude]}
                      icon={customIcon(pin.type) as any}
                      eventHandlers={{
                        click: () => setSelectedLocation(pin)
                      }}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <h3 className="font-medium text-lg">{pin.title}</h3>
                          <p className="text-sm">{pin.description}</p>
                          {pin.userId === userId && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => pin.id && handleDeletePin(pin.id)}
                              className="w-full mt-2"
                            >
                              Remove Pin
                            </Button>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* Temporary marker for adding a new pin */}
                  {newPinLocation && (
                    <Marker
                      position={[newPinLocation.lat, newPinLocation.lng]}
                      icon={customIcon(newPinData.type as 'ewaste' | 'shops' | 'ngos' | 'other') as any}
                    >
                      <Popup>
                        <div className="font-medium">{newPinData.title || "New location"}</div>
                        <p className="text-sm text-gray-500">{newPinData.description || "Description pending..."}</p>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Map click handler */}
                  <MapClickHandler onMapClick={handleMapClick} />
                  
                  {/* User location marker and accuracy circle */}
                  {userLocation && (
                    <UserLocationMarker position={userLocation} accuracy={locationAccuracy} />
                  )}
                </MapContainer>
                
                {/* Location button */}
                <div className="absolute bottom-6 right-6 z-50">
                  <Button 
                    className={`rounded-full w-12 h-12 p-0 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-lg locate-btn ${isLocatingUser ? 'locate-btn-active' : ''}`}
                    onClick={locateUser}
                    disabled={isLocatingUser}
                    title="Find my location"
                  >
                    {isLocatingUser ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Compass className="h-6 w-6" />
                    )}
                  </Button>
                </div>
                
                {/* Geolocation error message */}
                {geolocationError && (
                  <div className="absolute bottom-20 right-6 left-6 md:left-auto md:w-80 bg-white/90 backdrop-blur-sm text-red-600 p-3 rounded-lg shadow-lg border border-red-200 z-50 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 shrink-0">⚠️</div>
                      <div>{geolocationError}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {user ? (
                <p className="text-xs text-gray-500 mt-2">
                  Click anywhere on the map to add a new eco-friendly location
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Sign in to add new locations to the map
                </p>
              )}
            </CardContent>
          </Card>

          </div>
          {/* Location Details */}
          <Card className="h-[70vh] shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-emerald-800">Location Details</CardTitle>
              <CardDescription className="text-emerald-700/70">
                {selectedLocation 
                  ? `Information about ${selectedLocation.title}`
                  : "Select a location to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] overflow-auto px-5 py-6">
              {selectedLocation ? (
                <div className="space-y-6">
                  <div className="fade-in">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-800">{selectedLocation.title}</h3>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <div className="slide-in" style={{animationDelay: '0.1s'}}>
                            {getTypeBadge(selectedLocation.type)}
                          </div>
                          {selectedLocation.rating && (
                            <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-full slide-in" style={{animationDelay: '0.2s'}}>
                              <Star className="h-4 w-4" />
                              <span className="text-sm font-medium">{selectedLocation.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedLocation.points && (
                        <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1.5 text-base font-semibold bounce-in" style={{animationDelay: '0.3s'}}>
                          +{selectedLocation.points} pts
                        </Badge>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3 rounded-lg mb-6 slide-in" style={{animationDelay: '0.4s'}}>
                      <p className="italic text-emerald-700">{selectedLocation.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg p-4 shadow-sm border border-emerald-100 fade-in" style={{animationDelay: '0.5s'}}>
                    {selectedLocation.address && (
                      <div className="flex items-start space-x-3 bg-emerald-50 p-3 rounded-lg location-card">
                        <div className="bg-emerald-100 p-2 rounded-full eco-icon-pulse">
                          <MapPin className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800">Address</p>
                          <p className="text-sm text-emerald-600">{selectedLocation.address}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3 bg-emerald-50 p-3 rounded-lg location-card">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <Navigation className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">Distance</p>
                        <p className="text-sm text-emerald-600">{getFormattedDistance(selectedLocation)}</p>
                      </div>
                    </div>
                    {selectedLocation.hours && (
                      <div className="flex items-start space-x-3 bg-emerald-50 p-3 rounded-lg location-card">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <Clock className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800">Hours</p>
                          <p className="text-sm text-emerald-600">{selectedLocation.hours}</p>
                        </div>
                      </div>
                    )}
                    {selectedLocation.phone && (
                      <div className="flex items-start space-x-3 bg-emerald-50 p-3 rounded-lg location-card">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <div className="h-5 w-5 text-emerald-600 flex items-center justify-center">📞</div>
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800">Contact</p>
                          <p className="text-sm text-emerald-600">{selectedLocation.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3 bg-emerald-50 p-3 rounded-lg location-card">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">Community</p>
                        <p className="text-sm text-emerald-600">
                          {selectedLocation.visitors || 0} visitors this month
                        </p>
                      </div>
                    </div>
                    {isWithin5km(selectedLocation) && (
                      <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-lg location-card col-span-2">
                        <div className="bg-blue-100 p-2 rounded-full eco-icon-pulse">
                          <Compass className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Nearby Location!</p>
                          <p className="text-sm text-blue-600">
                            This eco-friendly location is within 5km of your current position
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 fade-in" style={{animationDelay: '0.6s'}}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        {selectedLocation.verified ? (
                          <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1 slide-in" style={{animationDelay: '0.7s'}}>
                            <CheckCircle className="h-3.5 w-3.5" /> Verified Location
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 flex items-center gap-1 slide-in" style={{animationDelay: '0.7s'}}>
                            <Clock className="h-3.5 w-3.5" /> Pending Verification
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-slate-50 shimmer slide-in" style={{animationDelay: '0.8s'}}>
                        Added by: {selectedLocation.userId.substring(0, 8)}...
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 py-5 bounce-in" 
                        style={{animationDelay: '0.9s'}}
                        onClick={() => {
                          // Open Google Maps directions in a new tab
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}&travelmode=driving`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Navigation className="h-4 w-4" /> Get Directions
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2 py-5 bounce-in" 
                        style={{animationDelay: '1s'}}
                        onClick={() => {
                          // Share the location via the Web Share API if available
                          if (navigator.share) {
                            navigator.share({
                              title: selectedLocation.title,
                              text: `Check out this eco-friendly location: ${selectedLocation.title}`,
                              url: `https://maps.google.com/?q=${selectedLocation.latitude},${selectedLocation.longitude}`
                            })
                            .catch(err => {
                              console.error("Error sharing:", err);
                              // Fallback - copy location to clipboard
                              const text = `${selectedLocation.title}: https://maps.google.com/?q=${selectedLocation.latitude},${selectedLocation.longitude}`;
                              navigator.clipboard.writeText(text);
                              alert("Location link copied to clipboard!");
                            });
                          } else {
                            // Fallback for browsers that don't support Web Share API
                            const text = `${selectedLocation.title}: https://maps.google.com/?q=${selectedLocation.latitude},${selectedLocation.longitude}`;
                            navigator.clipboard.writeText(text);
                            alert("Location link copied to clipboard!");
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4" /> Share Location
                      </Button>
                    </div>
                    
                    {selectedLocation.userId === userId && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => selectedLocation.id && handleDeletePin(selectedLocation.id)}
                        className="w-full mt-3 flex items-center justify-center gap-2 bounce-in"
                        style={{animationDelay: '1.1s'}}
                      >
                        <Trash2 className="h-4 w-4" /> Remove This Location
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-inner border border-emerald-100 max-w-md mx-auto bounce-in">
                    <div className="bg-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 shadow-md eco-icon-pulse">
                      <MapPin className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2 fade-in" style={{animationDelay: '0.2s'}}>No Location Selected</h3>
                    <p className="text-emerald-600 mb-4 fade-in" style={{animationDelay: '0.4s'}}>Select a location on the map or from the list below to view detailed information</p>
                    <div className="flex justify-center fade-in" style={{animationDelay: '0.6s'}}>
                      <Button 
                        variant="outline" 
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shimmer"
                        onClick={() => {
                          // Scroll to the location list section
                          document.querySelector('#location-list')?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                          // Reset filters to show all locations
                          setSelectedCategory("all");
                          setSearchQuery("");
                        }}
                      >
                        Browse All Locations
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Location List */}
        <Card id="location-list" className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50 overflow-hidden mt-8">
          <CardHeader className="bg-gradient-to-r from-emerald-100/70 to-teal-100/70 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Nearby Eco Locations
                </CardTitle>
                <CardDescription className="text-emerald-700/70 mt-1">
                  <span>{filteredLocations.length} eco-friendly locations found</span>
                  {showNearbyOnly && userLocation && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                      <Compass className="h-3 w-3 mr-1" /> Within 5km
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setShowNearbyOnly(false);
                    // Reset any filtering
                    if (mapRef.current) {
                      mapRef.current.flyTo(mapCenter, 13, { animate: true, duration: 1 });
                    }
                  }}
                >
                  Clear All Filters
                </Button>
                {userLocation && (
                  <Button 
                    variant={showNearbyOnly ? "default" : "outline"}
                    className={`border-blue-200 ${showNearbyOnly ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}
                    onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                  >
                    <Compass className="h-4 w-4 mr-2" />
                    Within 5km
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLocations.length > 0 ? filteredLocations.map((location, index) => (
                <div
                  key={location.id}
                  onClick={() => setSelectedLocation(location)}
                  className={`location-card group cursor-pointer bg-white rounded-xl transition-all duration-300 hover:shadow-lg overflow-hidden fade-in ${
                    selectedLocation?.id === location.id 
                      ? "ring-2 ring-emerald-500 shadow-md" 
                      : "border border-emerald-100"
                  }`}
                  style={{ animationDelay: `${0.05 * (index % 10)}s` }}
                >
                  <div className={`h-3 ${getLocationTypeColor(location.type)}`}></div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 rounded-full shadow-inner">
                          {getTypeIcon(location.type)}
                        </div>
                        <h4 className="font-medium text-emerald-900 group-hover:text-emerald-700">{location.title}</h4>
                      </div>
                      {location.verified && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1 text-emerald-700">
                        <Navigation className="h-3.5 w-3.5" />
                        <span className="text-xs">{getFormattedDistance(location)}</span>
                      </div>
                      {location.rating && (
                        <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-medium">{location.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    {location.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-2 mb-3">
                        {location.description.substring(0, 100)}
                        {location.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      {location.points && (
                        <Badge className="bg-emerald-100 text-emerald-700 py-0.5">
                          +{location.points} eco points
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-0 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocation(location);
                        }}
                      >
                        View Details →
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-12 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-100/50">
                  <div className="bg-white/80 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MapPin className="h-10 w-10 text-emerald-300" />
                  </div>
                  <p className="text-emerald-800 font-semibold text-lg">No locations found</p>
                  <p className="text-emerald-600 mt-2 max-w-md mx-auto">Try changing your filters or add a new location to contribute to the eco-friendly community</p>
                  <Button 
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      // Center the map for better placement experience
                      if (mapRef.current) {
                        const center = mapRef.current.getCenter();
                        handleMapClick(center.lat, center.lng);
                      }
                    }}
                  >
                    Add New Location
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* User ID Display Box */}
        <div className="mt-8 rounded-xl shadow-xl overflow-hidden relative">
          {/* Decorative pattern background */}
          <div className="absolute inset-0 bg-emerald-800 opacity-90">
            <div className="absolute inset-0" style={{ 
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              backgroundSize: "24px 24px"
            }}></div>
          </div>
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/80 to-teal-500/80 backdrop-blur-md"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-lg fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-full eco-icon-pulse">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">EcoTrack Contributor</h3>
                </div>
                <p className="text-emerald-50 text-lg mb-4">
                  {user ? 'Thank you for contributing to a sustainable future!' : 'Sign in to add eco-locations to the map'}
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <Badge className="bg-emerald-500/30 text-white border border-emerald-300/30 py-1.5 px-3 slide-in" style={{animationDelay: '0.1s'}}>
                    {filteredLocations.length} Total Locations
                  </Badge>
                  <Badge className="bg-emerald-500/30 text-white border border-emerald-300/30 py-1.5 px-3 slide-in" style={{animationDelay: '0.2s'}}>
                    {user ? `${ecoPins.filter(pin => pin.userId === userId).length} Your Contributions` : 'No Contributions Yet'}
                  </Badge>
                  {userLocation && (
                    <Badge className="bg-blue-500/30 text-white border border-blue-300/30 py-1.5 px-3 slide-in" style={{animationDelay: '0.3s'}}>
                      {ecoPins.filter(pin => {
                        if (!userLocation) return false;
                        const distanceInKm = calculateDistanceRaw(
                          userLocation.lat,
                          userLocation.lng,
                          pin.latitude,
                          pin.longitude
                        );
                        return distanceInKm <= 5;
                      }).length} Locations Within 5km
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg py-4 px-6 rounded-xl border border-white/20 shadow-lg bounce-in">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
                  <p className="text-sm text-emerald-100">Active Session</p>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-white/70 spin-slow" />
                  <p className="font-mono text-lg font-bold text-white tracking-wider">
                    {userId !== 'anonymous' ? userId.substring(0, 8) + "..." : "Guest User"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-emerald-100/20">
              <p className="text-emerald-50 max-w-md">
                Your contributions help build a comprehensive database of eco-friendly locations in your community.
                Together we can create positive environmental impact!
              </p>
              
              <Button 
                className="bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2"
                onClick={async () => {
                  // Check for mock authentication
                  const isMockSignedIn = localStorage.getItem('is_mock_signed_in') === 'true';
                  const isAuthenticated = user || isMockSignedIn;
                  
                  if (!isAuthenticated) {
                    try {
                      console.log("Starting anonymous sign-in process...");
                      // Add loading state
                      const button = document.activeElement;
                      if (button instanceof HTMLButtonElement) {
                        button.disabled = true;
                        button.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...';
                      }
                      
                      const newUser = await signInAsAnonymous();
                      console.log("Sign-in process completed:", newUser);
                      
                      if (newUser) {
                        console.log("User is now authenticated:", newUser.uid);
                        // Force state update for our mock authentication
                        if (!user) {
                          setUserId(newUser.uid);
                        }
                        alert(`Successfully signed in as ${newUser.uid.substring(0, 8)}...! You can now add locations to the map.`);
                      } else {
                        throw new Error("Sign-in completed but no user was returned");
                      }
                    } catch (error) {
                      console.error("Failed to sign in anonymously:", error);
                      
                      // Provide more specific error message
                      if (error.message && error.message.includes("dummy credentials")) {
                        alert("ERROR: Firebase is using dummy credentials. Please configure proper Firebase credentials in the firebase.ts file.");
                      } else if (error.code) {
                        alert(`Authentication failed: ${error.code}. Please check console for details.`);
                      } else {
                        alert(`Failed to sign in: ${error.message || "Unknown error"}. Please try again.`);
                      }
                    } finally {
                      // Reset button if needed
                      const buttons = document.querySelectorAll('button');
                      buttons.forEach(button => {
                        if (button.innerHTML.includes('Signing in...')) {
                          button.disabled = false;
                          button.innerHTML = '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg> Sign In to Contribute';
                        }
                      });
                    }
                  } else {
                    // User is already signed in, navigate to impact page or show impact
                    console.log("User is already signed in as:", userId);
                    alert("You're already signed in as: " + userId.substring(0, 8) + "...");
                  }
                }}
              >
                {userId !== 'anonymous' ? 
                  <><CheckCircle className="h-4 w-4" /> View Your Impact</> : 
                  <><Plus className="h-4 w-4" /> Sign In to Contribute</>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Pin Dialog */}
      <AlertDialog open={isAddingPin} onOpenChange={setIsAddingPin}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl max-w-md add-location-dialog">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 z-0"></div>
          <div className="relative z-10 add-location-dialog-content">
            <div className="absolute top-2 right-2 z-20">
              <button 
                onClick={() => setIsAddingPin(false)}
                className="rounded-full p-1.5 bg-white/80 hover:bg-white text-emerald-800 hover:text-emerald-900 transition-colors shadow-sm"
                aria-label="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <AlertDialogHeader>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                <MapPin className="h-8 w-8 text-emerald-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-emerald-800 text-center">
                Add New Eco-Friendly Location
              </AlertDialogTitle>
              <AlertDialogDescription className="text-emerald-700 text-center max-w-sm mx-auto">
                Your contribution helps others find sustainable options in the community.
              </AlertDialogDescription>
              
              <div className="mt-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Coordinates: {newPinLocation?.lat.toFixed(6)}, {newPinLocation?.lng.toFixed(6)}
                </p>
              </div>
            </AlertDialogHeader>
            
            <div className="space-y-5 py-6 px-1 overflow-y-visible">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Location Name
                </label>
                <Input 
                  placeholder="e.g. Green Earth Recycling Center" 
                  value={newPinData.title}
                  onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300 rounded-lg py-5"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Location Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.filter(c => c.id !== 'all').map((category) => (
                    <Button
                      key={category.id}
                      variant={newPinData.type === category.id ? "default" : "outline"}
                      onClick={() => setNewPinData({...newPinData, type: category.id as any})}
                      className={`flex items-center justify-center gap-2 py-4 ${
                        newPinData.type === category.id 
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-md" 
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <div className={`p-1.5 rounded-full ${newPinData.type === category.id ? "bg-white/20" : "bg-emerald-100"}`}>
                        <category.icon className="h-4 w-4" />
                      </div>
                      <span>{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Description
                </label>
                <textarea
                  placeholder="Tell others what makes this location eco-friendly..." 
                  value={newPinData.description}
                  onChange={(e) => setNewPinData({...newPinData, description: e.target.value})}
                  rows={3}
                  className="w-full rounded-lg border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Address
                </label>
                <Input 
                  placeholder="Street address (optional)" 
                  value={newPinData.address || ''}
                  onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                    <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Opening Hours
                  </label>
                  <Input 
                    placeholder="e.g. Mon-Fri: 9am-5pm (optional)" 
                    value={newPinData.hours || ''}
                    onChange={(e) => setNewPinData({...newPinData, hours: e.target.value})}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                    <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Contact Number
                  </label>
                  <Input 
                    placeholder="Phone number (optional)" 
                    value={newPinData.phone || ''}
                    onChange={(e) => setNewPinData({...newPinData, phone: e.target.value})}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-300"
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-2">
                <label className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <span className="bg-emerald-100 h-1.5 w-1.5 rounded-full"></span> Environmental Impact Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewPinData({...newPinData, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (newPinData.rating || 0) ? "text-amber-500 fill-amber-500" : "text-gray-300"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-emerald-800 ml-2">
                    {newPinData.rating ? `${newPinData.rating} star rating` : "Rate the environmental impact"}
                  </span>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter className="border-t border-emerald-100 pt-4 flex flex-col sm:flex-row gap-2 sticky bottom-0 bg-white/95 backdrop-blur-sm">
              <AlertDialogCancel 
                onClick={() => {
                  // Only close the dialog but don't clear the location
                  setIsAddingPin(false);
                }}
                className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 sm:mt-0"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleAddPin}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-lg flex items-center justify-center gap-2"
                disabled={!newPinData.title || !newPinData.description}
              >
                <Plus className="h-4 w-4" /> Add Location
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EcoMap;
