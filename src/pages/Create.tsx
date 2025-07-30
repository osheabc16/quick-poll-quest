import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Sparkles, Share2, BarChart3 } from "lucide-react";

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
    commentPrompt: "",
    creatorComment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPollId, setCreatedPollId] = useState<string | null>(null);
  const [createdPollData, setCreatedPollData] = useState<any>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteComment, setVoteComment] = useState("");
  const [voteResults, setVoteResults] = useState<any>(null);

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
          creator_comment: formData.creatorComment.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCreatedPollId(data.id);
      setCreatedPollData(data);
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

  const handleVote = async (choice: string) => {
    if (!createdPollId || hasVoted) return;
    
    setIsVoting(true);
    try {
      // Convert the actual option text to the database format
      const optionChoice = choice === createdPollData.option_a ? "option_a" : "option_b";
      
      const { error } = await supabase
        .from("votes")
        .insert({
          poll_id: createdPollId,
          option_choice: optionChoice,
          voter_ip: null,
          comment: voteComment.trim() || null,
        });

      if (error) throw error;

      // Fetch quick results after voting
      const { data: votes } = await supabase
        .from("votes")
        .select("option_choice")
        .eq("poll_id", createdPollId);

      if (votes) {
        const optionACount = votes.filter(v => v.option_choice === "option_a").length;
        const optionBCount = votes.filter(v => v.option_choice === "option_b").length;
        const total = votes.length;
        
        setVoteResults({
          optionA: { count: optionACount, percentage: Math.round((optionACount / total) * 100) },
          optionB: { count: optionBCount, percentage: Math.round((optionBCount / total) * 100) },
          total,
          userChoice: choice,
          userComment: voteComment.trim() || null
        });
      }

      setHasVoted(true);
      toast({
        title: "Vote recorded! 🗳️",
        description: `You voted for "${choice}"`,
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      optionA: "",
      optionB: "",
      expiration: "",
      allowComments: true,
      commentPrompt: "",
      creatorComment: "",
    });
    setCreatedPollId(null);
    setCreatedPollData(null);
    setHasVoted(false);
    setVoteComment("");
    setVoteResults(null);
  };

  if (createdPollId) {
    const pollLink = `${window.location.origin}/poll/${createdPollId}`;
    
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border p-4">
          <div className="max-w-4xl mx-auto">
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
        
        <main className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Celebration Header */}
          <Card className="text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader className="pb-4">
              <div className="animate-scale-in">
                <CardTitle className="flex items-center justify-center gap-3 text-3xl mb-2">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  Your poll is live!
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </CardTitle>
                <CardDescription className="text-lg">
                  You can vote now and share the link with your friends.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Share */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Your Poll
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">Poll URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-background rounded text-sm break-all">
                        {pollLink}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPollLink}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Voting Experience */}
            <div className="space-y-6">
              {/* Voting Section */}
              {createdPollData && !hasVoted && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-center">{createdPollData.question}</CardTitle>
                    <CardDescription className="text-center">
                      Cast your vote as the poll creator!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 text-lg hover-scale"
                        onClick={() => handleVote(createdPollData.option_a)}
                        disabled={isVoting}
                      >
                        {createdPollData.option_a}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 text-lg hover-scale"
                        onClick={() => handleVote(createdPollData.option_b)}
                        disabled={isVoting}
                      >
                        {createdPollData.option_b}
                      </Button>
                    </div>

                    {/* Comment Field */}
                    {createdPollData.allow_comments && (
                      <div className="space-y-2">
                        <Label htmlFor="vote-comment">
                          {createdPollData.comment_prompt || "Add a comment (optional)"}
                        </Label>
                        <Textarea
                          id="vote-comment"
                          placeholder="Share your thoughts..."
                          value={voteComment}
                          onChange={(e) => setVoteComment(e.target.value)}
                          className="min-h-[80px]"
                          disabled={isVoting}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Results Preview */}
              {hasVoted && voteResults && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <BarChart3 className="w-5 h-5" />
                      Your Vote & Live Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✅ You voted for: <span className="font-bold">{voteResults.userChoice}</span>
                      </p>
                      {voteResults.userComment && (
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1 italic">
                          "{voteResults.userComment}"
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{createdPollData.option_a}</span>
                          <span className="font-medium">{voteResults.optionA.count} votes ({voteResults.optionA.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${voteResults.optionA.percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{createdPollData.option_b}</span>
                          <span className="font-medium">{voteResults.optionB.count} votes ({voteResults.optionB.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-secondary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${voteResults.optionB.percentage}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center pt-2">
                        Total votes: {voteResults.total}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
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

              <div className="space-y-2">
                <Label htmlFor="creator-comment">
                  Add your perspective (optional)
                </Label>
                <Textarea
                  id="creator-comment"
                  placeholder="Share why you created this poll or your own thoughts..."
                  value={formData.creatorComment}
                  onChange={(e) => setFormData({ ...formData, creatorComment: e.target.value })}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  This will be shown with your poll results as the creator's perspective
                </p>
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

              {formData.allowComments && (
                <div className="space-y-2">
                  <Label htmlFor="commentPrompt">
                    Comment Prompt (Optional)
                  </Label>
                  <Textarea
                    id="commentPrompt"
                    placeholder="e.g., Tell us why you chose this option..."
                    value={formData.commentPrompt}
                    onChange={(e) => setFormData({ ...formData, commentPrompt: e.target.value })}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown to voters when they can leave a comment
                  </p>
                </div>
              )}

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