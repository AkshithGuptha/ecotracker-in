
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Recycle, Car, ShoppingBag, Lightbulb, Droplets, TreePine } from "lucide-react";

const LogActivity = () => {
  const [activities, setActivities] = useState([
    { id: 1, type: "recycle", description: "Recycled 5 plastic bottles", points: 10, date: "Today, 2:30 PM" },
    { id: 2, type: "carpool", description: "Carpooled to work", points: 25, date: "Today, 8:00 AM" },
    { id: 3, type: "reusable", description: "Used cloth shopping bags", points: 15, date: "Yesterday, 6:00 PM" }
  ]);

  const [selectedActivity, setSelectedActivity] = useState("");
  const [activityDetails, setActivityDetails] = useState("");
  const [quantity, setQuantity] = useState("");

  const activityTypes = [
    {
      id: "recycle",
      name: "Recycling",
      icon: Recycle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      points: 10,
      examples: ["Recycled plastic bottles", "Separated paper waste", "Composted organic waste"]
    },
    {
      id: "carpool",
      name: "Carpooling",
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      points: 25,
      examples: ["Shared ride to work", "Used public transport", "Walked/cycled instead of driving"]
    },
    {
      id: "reusable",
      name: "Reusable Items",
      icon: ShoppingBag,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      points: 15,
      examples: ["Used cloth bags", "Brought reusable coffee cup", "Used metal water bottle"]
    },
    {
      id: "energy",
      name: "Energy Saving",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      points: 20,
      examples: ["Turned off unused lights", "Unplugged electronics", "Used natural lighting"]
    },
    {
      id: "water",
      name: "Water Conservation",
      icon: Droplets,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      points: 15,
      examples: ["Took shorter shower", "Fixed leaky tap", "Collected rainwater"]
    },
    {
      id: "plant",
      name: "Planting",
      icon: TreePine,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      points: 30,
      examples: ["Planted a tree", "Started herb garden", "Joined community gardening"]
    }
  ];

  const handleLogActivity = () => {
    if (!selectedActivity || !activityDetails) {
      toast({
        title: "Missing Information",
        description: "Please select an activity type and add details.",
        variant: "destructive"
      });
      return;
    }

    const activityType = activityTypes.find(type => type.id === selectedActivity);
    const newActivity = {
      id: activities.length + 1,
      type: selectedActivity,
      description: activityDetails,
      points: activityType?.points || 0,
      date: new Date().toLocaleString()
    };

    setActivities(prev => [newActivity, ...prev]);
    setSelectedActivity("");
    setActivityDetails("");
    setQuantity("");

    toast({
      title: "Activity Logged!",
      description: `You earned ${activityType?.points} eco-points!`,
      className: "bg-green-50 border-green-200"
    });
  };

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(at => at.id === type);
    return activityType ? activityType.icon : Plus;
  };

  const getActivityColor = (type: string) => {
    const activityType = activityTypes.find(at => at.id === type);
    return activityType ? activityType.color : "text-gray-600";
  };

  const totalPointsToday = activities
    .filter(activity => activity.date.includes("Today"))
    .reduce((sum, activity) => sum + activity.points, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Plus className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Log Activity</h1>
              <p className="text-gray-600">Record your eco-friendly actions and earn points</p>
            </div>
          </div>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalPointsToday}</div>
              <div className="text-sm text-gray-600">Points Today</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Logger */}
          <Card>
            <CardHeader>
              <CardTitle>Log New Activity</CardTitle>
              <CardDescription>Choose an eco-friendly action you've completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Activity Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Activity Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {activityTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedActivity === type.id ? "default" : "outline"}
                      onClick={() => setSelectedActivity(type.id)}
                      className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                        selectedActivity === type.id
                          ? "bg-green-600 hover:bg-green-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <type.icon className={`h-6 w-6 ${
                        selectedActivity === type.id ? "text-white" : type.color
                      }`} />
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          selectedActivity === type.id ? "text-white" : "text-gray-900"
                        }`}>
                          {type.name}
                        </div>
                        <div className={`text-xs ${
                          selectedActivity === type.id ? "text-green-100" : "text-gray-600"
                        }`}>
                          +{type.points} points
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Activity Details */}
              {selectedActivity && (
                <div className="space-y-3">
                  <Label htmlFor="activityDetails">Activity Details</Label>
                  <Input
                    id="activityDetails"
                    placeholder="Describe what you did..."
                    value={activityDetails}
                    onChange={(e) => setActivityDetails(e.target.value)}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Examples:</p>
                    {activityTypes.find(type => type.id === selectedActivity)?.examples.map((example, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActivityDetails(example)}
                        className="text-xs text-gray-600 hover:text-gray-900 h-auto p-1"
                      >
                        • {example}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleLogActivity}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!selectedActivity || !activityDetails}
              >
                Log Activity & Earn Points
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest eco-friendly actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-white`}>
                          <ActivityIcon className={`h-5 w-5 ${colorClass}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-600">{activity.date}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        +{activity.points} pts
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">156 points</div>
              <p className="text-sm text-gray-600">From 12 activities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">642 points</div>
              <p className="text-sm text-gray-600">From 48 activities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">All Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">2,847 points</div>
              <p className="text-sm text-gray-600">From 194 activities</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LogActivity;
