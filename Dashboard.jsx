import { useState, useEffect } from 'react';
import { messagesAPI, numbersAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  Shield, 
  Zap, 
  TrendingUp,
  Users,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react';
import '../App.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [myNumbers, setMyNumbers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsResponse, messagesResponse, numbersResponse] = await Promise.all([
        messagesAPI.getStats(),
        messagesAPI.getMessages({ limit: 5 }),
        numbersAPI.getMyNumbers()
      ]);
      
      setStats(statsResponse.data);
      setRecentMessages(messagesResponse.data.messages);
      setMyNumbers(numbersResponse.data.numbers);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiry';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.first_name || 'User'}! 👋
            </h1>
            <p className="text-blue-100">
              Welcome to your DispoSMS dashboard. Manage your temporary phone numbers and messages.
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{myNumbers.length}</div>
              <div className="text-xs text-blue-100">Active Numbers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.unread_messages || 0}</div>
              <div className="text-xs text-blue-100">Unread Messages</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_messages || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+{stats?.recent_messages_24h || 0} today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Numbers</p>
                <p className="text-2xl font-bold text-gray-900">{myNumbers.length}</p>
              </div>
              <Phone className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-1" />
              <span>{new Set(myNumbers.map(n => n.country_code)).size} countries</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.unread_messages || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Eye className="w-4 h-4 mr-1" />
              <span>Needs attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OTP Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.messages_by_type?.otp || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span>Secure codes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Numbers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Active Numbers</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Number
            </Button>
          </CardHeader>
          <CardContent>
            {myNumbers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Phone className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active numbers</p>
                <p className="text-xs">Assign a number to start receiving SMS</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myNumbers.slice(0, 3).map((number) => (
                  <div key={number.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-mono text-sm font-medium">{number.phone_number}</p>
                        <p className="text-xs text-gray-500">{number.country_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={number.status === 'assigned' ? 'default' : 'secondary'}>
                        {number.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeRemaining(number.expires_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {myNumbers.length > 3 && (
                  <p className="text-center text-sm text-gray-500">
                    +{myNumbers.length - 3} more numbers
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Recent Messages</CardTitle>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Messages will appear here when received</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {message.message_type === 'otp' ? (
                        <Shield className="w-4 h-4 text-green-500 mt-1" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-900">
                          {message.phone_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(message.received_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {message.message_content}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            message.message_type === 'otp' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {message.message_type.toUpperCase()}
                        </Badge>
                        {!message.is_read && (
                          <Badge variant="destructive" className="text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-6">
          <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
          <p className="text-sm text-gray-600">
            Receive SMS messages instantly with real-time notifications
          </p>
        </Card>

        <Card className="text-center p-6">
          <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">100% Secure</h3>
          <p className="text-sm text-gray-600">
            Your messages are encrypted and automatically deleted after 24 hours
          </p>
        </Card>

        <Card className="text-center p-6">
          <Globe className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Global Coverage</h3>
          <p className="text-sm text-gray-600">
            Access phone numbers from multiple countries worldwide
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

