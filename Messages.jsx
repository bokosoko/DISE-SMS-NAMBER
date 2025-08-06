import { useState, useEffect } from 'react';
import { messagesAPI, numbersAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  RefreshCw, 
  Copy, 
  Phone,
  Clock,
  Eye,
  EyeOff,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../App.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [myNumbers, setMyNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNumber, setSelectedNumber] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showRead, setShowRead] = useState('all');
  const [stats, setStats] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedNumber) params.phone_number_id = selectedNumber;
      if (messageType) params.message_type = messageType;
      if (showRead !== 'all') params.is_read = showRead === 'read';
      
      const response = await messagesAPI.getMessages(params);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNumbers = async () => {
    try {
      const response = await numbersAPI.getMyNumbers();
      setMyNumbers(response.data.numbers);
    } catch (error) {
      toast.error('Failed to fetch your numbers');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await messagesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const searchMessages = async () => {
    if (!searchQuery.trim()) {
      fetchMessages();
      return;
    }

    try {
      setLoading(true);
      const params = { q: searchQuery };
      
      if (selectedNumber) params.phone_number_id = selectedNumber;
      if (messageType) params.message_type = messageType;
      
      const response = await messagesAPI.searchMessages(params);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await messagesAPI.markAsRead(messageId);
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      fetchStats();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const params = {};
      if (selectedNumber) params.phone_number_id = selectedNumber;
      if (messageType) params.message_type = messageType;
      
      await messagesAPI.markAllAsRead(params);
      setMessages(messages.map(msg => ({ ...msg, is_read: true })));
      fetchStats();
      toast.success('All messages marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'otp':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'verification':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'otp':
        return 'bg-green-100 text-green-800';
      case 'verification':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const extractOTP = (content) => {
    const otpMatch = content.match(/\b\d{4,8}\b/);
    return otpMatch ? otpMatch[0] : null;
  };

  useEffect(() => {
    fetchMessages();
    fetchMyNumbers();
    fetchStats();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(searchMessages, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchMessages();
    }
  }, [searchQuery, selectedNumber, messageType, showRead]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">View and manage your SMS messages</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button onClick={fetchMessages} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_messages}</p>
                  <p className="text-sm text-gray-600">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <EyeOff className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.unread_messages}</p>
                  <p className="text-sm text-gray-600">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.messages_by_type?.otp || 0}</p>
                  <p className="text-sm text-gray-600">OTP Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recent_messages_24h}</p>
                  <p className="text-sm text-gray-600">Last 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Messages</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search message content..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="number-filter">Phone Number</Label>
              <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="All numbers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All numbers</SelectItem>
                  {myNumbers.map((number) => (
                    <SelectItem key={number.id} value={number.id.toString()}>
                      {number.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type-filter">Message Type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="otp">OTP</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="read-filter">Read Status</Label>
              <Select value={showRead} onValueChange={setShowRead}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All messages</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="read">Read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No messages found</p>
              <p className="text-sm">Messages will appear here when you receive SMS</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const otp = extractOTP(message.message_content);
                return (
                  <Card 
                    key={message.id} 
                    className={`transition-all hover:shadow-md ${
                      !message.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-mono text-sm">{message.phone_number}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getMessageTypeIcon(message.message_type)}
                            <Badge className={getMessageTypeColor(message.message_type)}>
                              {message.message_type.toUpperCase()}
                            </Badge>
                          </div>
                          {!message.is_read && (
                            <Badge variant="destructive" className="text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(message.received_at)}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">From: {message.sender_number}</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-900 whitespace-pre-wrap">{message.message_content}</p>
                        </div>
                      </div>
                      
                      {otp && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">OTP Code:</span>
                              <span className="font-mono text-lg font-bold text-green-900">{otp}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(otp)}
                              className="border-green-300 text-green-700 hover:bg-green-100"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(message.message_content)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Message
                        </Button>
                        
                        {!message.is_read && (
                          <Button
                            size="sm"
                            onClick={() => markAsRead(message.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;

