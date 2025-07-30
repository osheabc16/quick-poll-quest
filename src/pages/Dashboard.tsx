import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/utils/auth";
import { formatDistanceToNow } from "date-fns";
import { Copy, Eye, Square, Trash2, Plus } from "lucide-react";

interface Poll {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  is_closed: boolean;
  expires_at: string | null;
  created_at: string;
  vote_count: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPolls();
    }
  }, [user]);

  const fetchPolls = async () => {
    if (!user) return;

    setLoadingPolls(true);
    try {
      // Fetch polls with vote counts
      const { data: pollsData, error } = await supabase
        .from("polls")
        .select(`
          id,
          question,
          option_a,
          option_b,
          is_closed,
          expires_at,
          created_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get vote counts for each poll
      const pollsWithCounts = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { count } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);

          return {
            ...poll,
            vote_count: count || 0,
          };
        })
      );

      setPolls(pollsWithCounts);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive",
      });
    } finally {
      setLoadingPolls(false);
    }
  };

  const copyPollLink = (pollId: string) => {
    const link = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Poll link copied to clipboard",
    });
  };

  const closePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from("polls")
        .update({ is_closed: true })
        .eq("id", pollId);

      if (error) throw error;

      setPolls(polls.map(poll => 
        poll.id === pollId ? { ...poll, is_closed: true } : poll
      ));

      toast({
        title: "Poll closed",
        description: "Your poll has been closed successfully",
      });
    } catch (error) {
      console.error("Error closing poll:", error);
      toast({
        title: "Error",
        description: "Failed to close poll",
        variant: "destructive",
      });
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", pollId);

      if (error) throw error;

      setPolls(polls.filter(poll => poll.id !== pollId));

      toast({
        title: "Poll deleted",
        description: "Your poll has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (poll: Poll) => {
    if (poll.is_closed) {
      return <Badge variant="destructive">Closed</Badge>;
    }

    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }

    return <Badge variant="default">Open</Badge>;
  };

  const getExpiryText = (poll: Poll) => {
    if (poll.is_closed) return "Closed";
    if (!poll.expires_at) return "No expiry";

    const expiryDate = new Date(poll.expires_at);
    const now = new Date();

    if (expiryDate < now) {
      return "Expired";
    }

    return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Polls</h1>
            <p className="text-muted-foreground">View, share, or close your polls. Let the debates begin!</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        {loadingPolls ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse">Loading polls...</div>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">You haven't created any polls yet.</h2>
            <p className="text-muted-foreground mb-8">
              Get started by creating your first poll and see what people think!
            </p>
            <Button onClick={() => navigate("/create")} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New Poll
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Your Polls</h2>
                <p className="text-sm text-muted-foreground">
                  {polls.length} poll{polls.length !== 1 ? 's' : ''} created
                </p>
              </div>
              <Button onClick={() => navigate("/create")} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New Poll
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {polls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{poll.question}</CardTitle>
                      {getStatusBadge(poll)}
                    </div>
                    <CardDescription className="text-sm">
                      {poll.option_a} vs {poll.option_b}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <strong>{poll.vote_count}</strong> votes
                      </div>
                      <div>
                        Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {getExpiryText(poll)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/poll/${poll.id}/results`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Results
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPollLink(poll.id)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                      
                      {!poll.is_closed && (!poll.expires_at || new Date(poll.expires_at) > new Date()) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closePoll(poll.id)}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Close
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePoll(poll.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;