import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Users, Zap, Shield, ArrowRight, Star, TrendingUp } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        totalPolls: 1247,
        totalVotes: 8934,
        activeUsers: 156
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-2xl font-semibold text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">This or That</h1>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Star className="h-3 w-3 mr-1" />
            Create polls in seconds
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Make Decisions
            <span className="text-primary"> Together</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create engaging polls, gather instant feedback, and make better decisions with your team, friends, or community.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Join a Poll
            </Button>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose This or That?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for speed, simplicity, and real-time collaboration
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Create polls in seconds and get instant results. No complicated setup required.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Real-time Results</CardTitle>
              <CardDescription>
                Watch votes come in live with beautiful charts and real-time updates.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security and privacy controls.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Rich Analytics</CardTitle>
              <CardDescription>
                Get detailed insights with charts, demographics, and voting patterns.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Customizable</CardTitle>
              <CardDescription>
                Set expiration dates, add comments, and customize your polls to fit your needs.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ArrowRight className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Easy Sharing</CardTitle>
              <CardDescription>
                Share polls with a simple link. Works on any device, anywhere.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Polling?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users making better decisions together
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>&copy; 2024 This or That. Built with ❤️ for better decision making.</p>
      </footer>
    </div>
  );
};

export default Index;
