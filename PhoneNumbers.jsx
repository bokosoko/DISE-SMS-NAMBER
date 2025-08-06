import { useState, useEffect } from 'react';
import { numbersAPI } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, 
  Plus, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Search,
  Globe,
  Timer,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../App.css';

const PhoneNumbers = () => {
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [myNumbers, setMyNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(null);
  const [searchCountry, setSearchCountry] = useState('');
  const [duration, setDuration] = useState('1');

  const fetchAvailableNumbers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchCountry) params.country_code = searchCountry;
      
      const response = await numbersAPI.getAvailableNumbers(params);
      setAvailableNumbers(response.data.numbers);
    } catch (error) {
      toast.error('Failed to fetch available numbers');
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

  const assignNumber = async (numberId) => {
    try {
      setAssignLoading(numberId);
      await numbersAPI.assignNumber(numberId, parseInt(duration));
      toast.success('Number assigned successfully!');
      fetchAvailableNumbers();
      fetchMyNumbers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to assign number';
      toast.error(message);
    } finally {
      setAssignLoading(null);
    }
  };

  const releaseNumber = async (numberId) => {
    try {
      await numbersAPI.releaseNumber(numberId);
      toast.success('Number released successfully!');
      fetchAvailableNumbers();
      fetchMyNumbers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to release number';
      toast.error(message);
    }
  };

  const extendNumber = async (numberId) => {
    try {
      await numbersAPI.extendNumber(numberId, 1);
      toast.success('Number extended by 1 hour!');
      fetchMyNumbers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to extend number';
      toast.error(message);
    }
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

  const getStatusColor = (status, expiresAt) => {
    if (status === 'expired' || (expiresAt && new Date(expiresAt) <= new Date())) {
      return 'destructive';
    }
    if (status === 'assigned') return 'default';
    if (status === 'available') return 'secondary';
    return 'outline';
  };

  useEffect(() => {
    fetchAvailableNumbers();
    fetchMyNumbers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
          <p className="text-gray-600">Manage your temporary phone numbers</p>
        </div>
        <Button onClick={fetchAvailableNumbers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* My Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            My Numbers ({myNumbers.length})
          </CardTitle>
          <CardDescription>
            Your currently assigned phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myNumbers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No numbers assigned yet</p>
              <p className="text-sm">Assign a number from the available list below</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myNumbers.map((number) => (
                <Card key={number.id} className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-medium">{number.phone_number}</span>
                      </div>
                      <Badge variant={getStatusColor(number.status, number.expires_at)}>
                        {number.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>{number.country_code}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4" />
                        <span>{formatTimeRemaining(number.expires_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => extendNumber(number.id)}
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Extend
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => releaseNumber(number.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Release
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Available Numbers
          </CardTitle>
          <CardDescription>
            Choose from available temporary phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="country-search">Country Code</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="country-search"
                  placeholder="e.g., US, UK, CA"
                  className="pl-10"
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAvailableNumbers} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Numbers Grid */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
              <p className="text-gray-500">Loading available numbers...</p>
            </div>
          ) : availableNumbers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No available numbers found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableNumbers.map((number) => (
                <Card key={number.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span className="font-mono font-medium">{number.phone_number}</span>
                      </div>
                      <Badge variant="secondary">
                        {number.country_code}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Available</span>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => assignNumber(number.id)}
                      disabled={assignLoading === number.id}
                    >
                      {assignLoading === number.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Assign for {duration}h
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneNumbers;

