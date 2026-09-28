import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Lightbulb, Cog, Trophy, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const AboutUsPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const techStack = [
    "React", "TypeScript", "Tailwind CSS", "Node.js", "Supabase",
    "Google Maps API", "Chart.js", "Progressive Web App"
  ];

  const achievements = [
    { metric: "50,000+", description: "Active Users" },
    { metric: "2M kg", description: "CO₂ Reduced" },
    { metric: "100+", description: "Partner NGOs" },
    { metric: "500+", description: "Events Organized" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-br from-emerald-50 via-green-50 to-green-100 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950 p-2 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">About EcoTrackr</h1>
            <p className="text-lg text-emerald-900/80 dark:text-emerald-200/80 max-w-3xl mx-auto">
              Empowering individuals and communities to track, reduce, and offset their carbon footprint 
              while building a sustainable future together.
            </p>
          </div>

          {/* Our Mission */}
          <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-950/90 dark:text-emerald-50/90 leading-relaxed">
                To democratize environmental action by making carbon tracking accessible, engaging, and rewarding. 
                We believe that small, consistent actions by millions of people can create massive positive change 
                for our planet. Our mission is to bridge the gap between environmental awareness and meaningful action 
                through technology, community, and gamification.
              </p>
            </CardContent>
          </Card>

          {/* Why We Started */}
          <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Why We Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">The Problem</h3>
                  <p className="text-emerald-950/80 dark:text-emerald-100/70">
                    Climate change is accelerating, but many people feel overwhelmed and don't know where to start. 
                    Traditional environmental solutions often lack personal relevance and immediate feedback.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Our Solution</h3>
                  <p className="text-emerald-950/80 dark:text-emerald-100/70">
                    We created EcoTrackr to make environmental action personal, measurable, and rewarding. 
                    By gamifying sustainability, we turn climate action into an engaging, social experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What We Do */}
          <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                What We Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Carbon Tracking</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Easy-to-use tools for monitoring your daily carbon footprint across transportation, energy, and lifestyle choices.
                  </p>
                </div>
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Gamification</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Earn eco-points, unlock achievements, and compete with friends to make sustainability fun and engaging.
                  </p>
                </div>
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Community Building</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Connect with like-minded individuals, share success stories, and participate in local environmental initiatives.
                  </p>
                </div>
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Education</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Learn about climate science, sustainable practices, and actionable steps through interactive content and quizzes.
                  </p>
                </div>
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Local Discovery</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Find eco-friendly businesses, NGOs, and events in your area through our integrated mapping system.
                  </p>
                </div>
                <div className="p-4 border border-white/60 dark:border-white/10 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Rewards System</h3>
                  <p className="text-sm text-emerald-950/80 dark:text-emerald-100/70">
                    Redeem earned points for eco-friendly products, services, and experiences from our partner network.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tech Stack */}
            <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Tech Stack</CardTitle>
                <CardDescription className="text-emerald-950/80 dark:text-emerald-100/70">Built with modern, sustainable technologies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <Badge key={tech} className="bg-emerald-600/20 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200 border border-emerald-500/30">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements So Far */}
            <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Achievements So Far
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{achievement.metric}</div>
                      <div className="text-sm text-emerald-950/80 dark:text-emerald-100/70">{achievement.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Feedback */}
          <Card className="bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                Contact & Feedback
              </CardTitle>
              <CardDescription>
                <span className="text-emerald-950/80 dark:text-emerald-100/70">We'd love to hear from you! Share your thoughts, suggestions, or questions.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4">Get in Touch</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>
                      <a href="mailto:hello@ecotrackr.com" className="text-primary hover:underline ml-2">
                        hello@ecotrackr.com
                      </a>
                    </div>
                    <div>
                      <span className="font-medium">Support:</span>
                      <a href="mailto:support@ecotrackr.com" className="text-primary hover:underline ml-2">
                        support@ecotrackr.com
                      </a>
                    </div>
                    <div>
                      <span className="font-medium">Partnerships:</span>
                      <a href="mailto:partners@ecotrackr.com" className="text-primary hover:underline ml-2">
                        partners@ecotrackr.com
                      </a>
                    </div>
                    <div className="pt-4">
                      <span className="font-medium">Follow Us:</span>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm">Twitter</Button>
                        <Button variant="outline" size="sm">LinkedIn</Button>
                        <Button variant="outline" size="sm">Instagram</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4">Send us a Message</h3>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                      <Input
                        placeholder="Your Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <Input
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                    <Textarea
                      placeholder="Your message..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isSubmitting}
                        onClick={async () => {
                          if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                            toast({
                              title: "Error",
                              description: "Please fill in all fields",
                              variant: "destructive",
                            });
                            return;
                          }

                          setIsSubmitting(true);
                          try {
                            const response = await fetch('/api/contact/submit', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                ...formData,
                                type: 'email'
                              }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Message sent to email successfully!",
                              });
                              setFormData({ name: '', email: '', subject: '', message: '' });
                            } else {
                              toast({
                                title: "Error",
                                description: data.message || "Failed to send message",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to send message. Please try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send to Email
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={isSubmitting}
                        onClick={async () => {
                          if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                            toast({
                              title: "Error",
                              description: "Please fill in all fields",
                              variant: "destructive",
                            });
                            return;
                          }

                          setIsSubmitting(true);
                          try {
                            const response = await fetch('/api/contact/submit', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                ...formData,
                                type: 'phone'
                              }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Message sent to phone successfully!",
                              });
                              setFormData({ name: '', email: '', subject: '', message: '' });
                            } else {
                              toast({
                                title: "Error",
                                description: data.message || "Failed to send message",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to send message. Please try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send to Phone
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutUsPage;