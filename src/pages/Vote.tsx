import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, BarChart3 } from "lucide-react";

interface Poll {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  expires_at: string | null;
  is_closed: boolean;
  allow_comments: boolean;
}

interface Vote {
  option_choice: string;
  comment: string | null;
}

interface VoteResults {
  option_a_count: number;
  option_b_count: number;
  total_votes: number;
}

export default function Vote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [pollNotFound, setPollNotFound] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPoll();
      checkIfAlreadyVoted();
    }
  }, [id]);

  const fetchPoll = async () => {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching poll:", error);
        setPollNotFound(true);
        return;
      }

      if (!data) {
        setPollNotFound(true);
        return;
      }

      setPoll(data);
      
      // Check if poll is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        // Poll is expired, fetch results
        await fetchResults();
      }
    } catch (error) {
      console.error("Error:", error);
      setPollNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyVoted = () => {
    if (!id) return;
    
    const voteKey = `poll_vote_${id}`;
    const storedVote = localStorage.getItem(voteKey);
    
    if (storedVote) {
      const vote = JSON.parse(storedVote);
      setHasVoted(true);
      setUserVote(vote);
      fetchResults();
      setShowResults(true);
    }
  };

  const fetchResults = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("votes")
        .select("option_choice")
        .eq("poll_id", id);

      if (error) {
        console.error("Error fetching results:", error);
        return;
      }

      const optionACount = data.filter(vote => vote.option_choice === poll?.option_a).length;
      const optionBCount = data.filter(vote => vote.option_choice === poll?.option_b).length;
      const totalVotes = optionACount + optionBCount;

      setResults({
        option_a_count: optionACount,
        option_b_count: optionBCount,
        total_votes: totalVotes
      });
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const submitVote = async () => {
    if (!selectedOption || !poll?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          poll_id: poll.id,
          option_choice: selectedOption,
          comment: comment.trim() || null,
          voter_ip: null // We're not tracking IP for privacy
        });

      if (error) {
        console.error("Error submitting vote:", error);
        toast({
          title: "Error",
          description: "Failed to submit your vote. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Store vote in localStorage to prevent double voting
      const voteData = {
        option_choice: selectedOption,
        comment: comment.trim() || null
      };
      localStorage.setItem(`poll_vote_${poll.id}`, JSON.stringify(voteData));
      
      setHasVoted(true);
      setUserVote(voteData);
      
      toast({
        title: "Vote Submitted! 🗳️",
        description: `You're now on Team ${selectedOption === 'option_a' ? poll.option_a : poll.option_b}!`,
      });

      // Smooth transition to results
      setTimeout(() => {
        setShowResults(true);
      }, 500);

      // Fetch updated results
      await fetchResults();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isPollExpired = () => {
    if (!poll?.expires_at) return false;
    return new Date(poll.expires_at) < new Date();
  };

  const isPollClosed = () => {
    return poll?.is_closed || isPollExpired();
  };

  const getOptionPercentage = (optionCount: number) => {
    if (!results || results.total_votes === 0) return 0;
    return Math.round((optionCount / results.total_votes) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (pollNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Poll Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Oops! This poll doesn't exist or has expired.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isPollClosed() ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Poll Closed
                </Badge>
              ) : hasVoted ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  You Voted
                </Badge>
              ) : null}
            </div>
            <CardTitle className="text-2xl font-bold">{poll.question}</CardTitle>
            <p className="text-muted-foreground">
              {isPollClosed() 
                ? "This poll is now closed." 
                : hasVoted 
                  ? `You're on Team ${userVote?.option_choice === poll.option_a ? poll.option_a : poll.option_b}! Here's the current vote breakdown.`
                  : "Choose your side and see live results instantly!"
              }
            </p>
          </CardHeader>

          {isPollClosed() ? (
            <CardContent>
              <div className="text-center">
                <Button 
                  onClick={() => navigate(`/poll/${id}/results`)} 
                  className="w-full"
                >
                  View Final Results
                </Button>
              </div>
            </CardContent>
          ) : hasVoted && showResults ? (
            <CardContent className="space-y-6 animate-fade-in">
              {/* Voter Status Banner */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">
                    You voted for {userVote?.option_choice === poll.option_a ? poll.option_a : poll.option_b}!
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Here are the live results visible only to you as a voter
                </p>
              </div>

              {/* Live Results */}
              {results && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Live Vote Breakdown</span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${userVote?.option_choice === poll.option_a ? "text-primary font-bold" : ""}`}>
                          {poll.option_a}
                          {userVote?.option_choice === poll.option_a && " 👈"}
                        </span>
                        <span className="text-sm font-medium">
                          {results.option_a_count} votes ({getOptionPercentage(results.option_a_count)}%)
                        </span>
                      </div>
                      <Progress 
                        value={getOptionPercentage(results.option_a_count)} 
                        className="h-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${userVote?.option_choice === poll.option_b ? "text-primary font-bold" : ""}`}>
                          {poll.option_b}
                          {userVote?.option_choice === poll.option_b && " 👈"}
                        </span>
                        <span className="text-sm font-medium">
                          {results.option_b_count} votes ({getOptionPercentage(results.option_b_count)}%)
                        </span>
                      </div>
                      <Progress 
                        value={getOptionPercentage(results.option_b_count)} 
                        className="h-3"
                      />
                    </div>

                    <p className="text-center text-sm text-muted-foreground pt-2">
                      Total votes: {results.total_votes}
                    </p>
                  </div>
                </div>
              )}

              {/* User's Comment (Read-Only) */}
              {userVote?.comment && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your Comment</span>
                  </div>
                  <div className="bg-background/50 rounded p-3 border-l-4 border-primary">
                    <p className="text-sm italic">"{userVote.comment}"</p>
                  </div>
                </div>
              )}

              {/* Final Results Message */}
              <div className="text-center text-sm bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-lg border">
                <p className="text-muted-foreground">
                  📊 Final results and all comments will be visible to everyone after the poll closes.
                </p>
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-6">
              {/* Voting options */}
              <div className="space-y-3">
                <Button
                  variant={selectedOption === poll.option_a ? "default" : "outline"}
                  onClick={() => setSelectedOption(poll.option_a)}
                  className="w-full h-auto p-6 text-left justify-start hover-scale transition-all duration-200"
                  size="lg"
                >
                  <div>
                    <div className="font-medium text-lg">{poll.option_a}</div>
                  </div>
                </Button>

                <Button
                  variant={selectedOption === poll.option_b ? "default" : "outline"}
                  onClick={() => setSelectedOption(poll.option_b)}
                  className="w-full h-auto p-6 text-left justify-start hover-scale transition-all duration-200"
                  size="lg"
                >
                  <div>
                    <div className="font-medium text-lg">{poll.option_b}</div>
                  </div>
                </Button>
              </div>

              {/* Comment input (if enabled and option selected) */}
              {selectedOption && poll.allow_comments && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium">Want to add a reason?</label>
                  <Textarea
                    placeholder="Your comment is anonymous and will appear with the final results."
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 200))}
                    className="min-h-[80px]"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {comment.length}/200 characters
                  </p>
                </div>
              )}

              {/* Submit button */}
              <Button
                onClick={submitVote}
                disabled={!selectedOption || submitting}
                className="w-full hover-scale transition-all duration-200"
                size="lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting Vote...
                  </div>
                ) : (
                  "Submit Vote"
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}