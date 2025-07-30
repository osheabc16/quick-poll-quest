import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Trophy, 
  Share2, 
  Plus, 
  BarChart3, 
  MessageCircle, 
  Brain,
  Users,
  Clock,
  Copy,
  ArrowLeft,
  MessageSquareQuote
} from "lucide-react";

interface Poll {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  expires_at: string | null;
  is_closed: boolean;
  allow_comments: boolean;
  created_at: string;
  creator_comment: string | null;
}

interface Vote {
  option_choice: string;
  comment: string | null;
}

interface ResultData {
  optionACount: number;
  optionBCount: number;
  totalVotes: number;
  comments: string[];
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollNotFound, setPollNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPollAndResults();
    }
  }, [id]);

  const fetchPollAndResults = async () => {
    try {
      // Fetch poll data
      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (pollError || !pollData) {
        setPollNotFound(true);
        return;
      }

      setPoll(pollData);

      // Fetch votes and comments
      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("option_choice, comment")
        .eq("poll_id", id);

      if (votesError) {
        console.error("Error fetching votes:", votesError);
        return;
      }

      const optionACount = votes.filter(v => v.option_choice === pollData.option_a).length;
      const optionBCount = votes.filter(v => v.option_choice === pollData.option_b).length;
      const comments = votes
        .filter(v => v.comment && v.comment.trim())
        .map(v => v.comment!);

      setResults({
        optionACount,
        optionBCount,
        totalVotes: optionACount + optionBCount,
        comments
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      setPollNotFound(true);
    } finally {
      setLoading(false);
    }
  };


  const getWinner = () => {
    if (!results) return null;
    
    if (results.optionACount > results.optionBCount) {
      return { option: poll?.option_a, type: 'a' };
    } else if (results.optionBCount > results.optionACount) {
      return { option: poll?.option_b, type: 'b' };
    }
    return null; // Tie
  };

  const getPercentage = (count: number) => {
    if (!results || results.totalVotes === 0) return 0;
    return Math.round((count / results.totalVotes) * 100);
  };

  const copyResultsLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied! 📋",
      description: "Results page link copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (pollNotFound || !poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This poll doesn't exist or results aren't available yet.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const winner = getWinner();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Poll Summary */}
        <Card className="text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              <Badge variant="secondary">Voting Closed</Badge>
            </div>
            <CardTitle className="text-3xl mb-2 animate-fade-in">
              {poll.question}
            </CardTitle>
            {poll.creator_comment && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareQuote className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Creator's Perspective</span>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  "{poll.creator_comment}"
                </p>
              </div>
            )}
            <p className="text-muted-foreground text-lg mt-4">
              Voting is now closed. Here's how it ended.
            </p>
          </CardHeader>
        </Card>

        {/* Winner Announcement */}
        {results && results.totalVotes > 0 && (
          <Card className="text-center">
            <CardContent className="pt-6">
              {winner ? (
                <div className="animate-scale-in">
                  <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    Winner: {winner.option} 🎉
                  </h2>
                  <p className="text-muted-foreground">
                    {getPercentage(winner.type === 'a' ? results.optionACount : results.optionBCount)}% of {results.totalVotes} voters chose this option
                  </p>
                </div>
              ) : (
                <div className="animate-scale-in">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    It's a tie! 🤝
                  </h2>
                  <p className="text-muted-foreground">
                    Both options received equal votes from {results.totalVotes} voters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Final Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results && results.totalVotes > 0 ? (
              <div className="space-y-4">
                {/* Option A */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">{poll.option_a}</span>
                    <div className="text-right">
                      <div className="font-bold text-xl">
                        {getPercentage(results.optionACount)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {results.optionACount} votes
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={getPercentage(results.optionACount)} 
                    className="h-4"
                  />
                </div>

                {/* Option B */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">{poll.option_b}</span>
                    <div className="text-right">
                      <div className="font-bold text-xl">
                        {getPercentage(results.optionBCount)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {results.optionBCount} votes
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={getPercentage(results.optionBCount)} 
                    className="h-4"
                  />
                </div>

                <div className="text-center pt-4">
                  <p className="text-lg font-medium">
                    Total Votes: {results.totalVotes}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  No votes were cast for this poll.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        {poll.allow_comments && results && results.comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Why people voted the way they did
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Individual Comments */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Voter Comments ({results.comments.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.comments.map((comment, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-muted/50 rounded-lg border text-sm"
                    >
                      <p className="italic">"{comment}"</p>
                      <span className="text-xs text-muted-foreground">
                        — Anonymous voter
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => navigate("/create")} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Another Poll
              </Button>
              
              {user && (
                <Button 
                  onClick={() => navigate("/dashboard")} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  My Polls
                </Button>
              )}
              
              <Button 
                onClick={copyResultsLink}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Share Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}