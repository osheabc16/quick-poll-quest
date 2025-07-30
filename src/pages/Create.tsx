import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Sparkles } from "lucide-react";

const Create = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    question: "",
    optionA: "",
    optionB: "",
    expiration: "",
    allowComments: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPollId, setCreatedPollId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.optionA.trim() || !formData.optionB.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the question and both options",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let expiresAt = null;
      
      if (formData.expiration) {
        const now = new Date();
        switch (formData.expiration) {
          case "1h":
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case "6h":
            expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
            break;
          case "1d":
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "3d":
            expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            break;
          case "1w":
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const { data, error } = await supabase
        .from("polls")
        .insert({
          user_id: user.id,
          question: formData.question.trim(),
          option_a: formData.optionA.trim(),
          option_b: formData.optionB.trim(),
          expires_at: expiresAt?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedPollId(data.id);
      toast({
        title: "Poll created successfully! 🎉",
        description: "Your poll is ready to share with the world",
      });

    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPollLink = () => {
    if (!createdPollId) return;
    
    const link = `${window.location.origin}/poll/${createdPollId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied! 📋",
      description: "Poll link copied to clipboard",
    });
  };

  const resetForm = () => {
    setFormData({
      question: "",
      optionA: "",
      optionB: "",
      expiration: "",
      allowComments: true,
    });
    setCreatedPollId(null);
  };

  if (createdPollId) {
    const pollLink = `${window.location.origin}/poll/${createdPollId}`;
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto p-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
                Poll Created Successfully!
              </CardTitle>
              <CardDescription>
                Your poll is ready to share with friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Share this link with friends:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm break-all">
                    {pollLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPollLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={resetForm} variant="outline">
                  Create Another Poll
                </Button>
                <Button onClick={() => navigate(`/poll/${createdPollId}/results`)}>
                  View Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Create New Poll</h1>
          <p className="text-muted-foreground">
            Ask the world what they think! 🌍
          </p>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Poll Details</CardTitle>
            <CardDescription>
              Create a fun 2-option poll to share with friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">
                  Poll Question <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="question"
                  placeholder="e.g., Tacos or Sushi? 🌮🍣"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">
                    Option A (Left Side) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="optionA"
                    placeholder="e.g., Tacos 🌮"
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="optionB">
                    Option B (Right Side) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="optionB"
                    placeholder="e.g., Sushi 🍣"
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Poll Expiration (Optional)</Label>
                <Select value={formData.expiration} onValueChange={(value) => setFormData({ ...formData, expiration: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration time (or leave open forever)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="6h">6 hours</SelectItem>
                    <SelectItem value="1d">1 day</SelectItem>
                    <SelectItem value="3d">3 days</SelectItem>
                    <SelectItem value="1w">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="comments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowComments: checked })}
                />
                <Label htmlFor="comments" className="text-sm">
                  Allow voters to leave comments? 💬
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Poll..." : "Create Poll 🚀"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Create;