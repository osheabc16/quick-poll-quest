import { supabase } from "@/integrations/supabase/client";

export const debugVotingIssue = async (pollId: string) => {
  console.log("🔍 Debugging voting issue for poll:", pollId);
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log("1. Testing Supabase connection...");
    const { data: connectionTest, error: connectionError } = await supabase
      .from("polls")
      .select("count")
      .limit(1);
    
    if (connectionError) {
      console.error("❌ Connection failed:", connectionError);
      return { success: false, error: "Connection failed", details: connectionError };
    }
    console.log("✅ Connection successful");

    // Test 2: Check if poll exists and is accessible
    console.log("2. Testing poll accessibility...");
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();
    
    if (pollError) {
      console.error("❌ Poll not accessible:", pollError);
      return { success: false, error: "Poll not accessible", details: pollError };
    }
    console.log("✅ Poll accessible:", poll);

    // Test 3: Check current votes for this poll
    console.log("3. Checking existing votes...");
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("*")
      .eq("poll_id", pollId);
    
    if (votesError) {
      console.error("❌ Cannot read votes:", votesError);
      return { success: false, error: "Cannot read votes", details: votesError };
    }
    console.log("✅ Current votes:", votes);

    // Test 4: Try to insert a test vote
    console.log("4. Testing vote insertion...");
    const testVote = {
      poll_id: pollId,
      option_choice: 'a',
      comment: 'Debug test vote',
      voter_ip: null
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from("votes")
      .insert(testVote)
      .select();
    
    if (insertError) {
      console.error("❌ Vote insertion failed:", insertError);
      return { success: false, error: "Vote insertion failed", details: insertError };
    }
    console.log("✅ Vote insertion successful:", insertData);

    // Test 5: Clean up test vote
    console.log("5. Cleaning up test vote...");
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from("votes")
        .delete()
        .eq("id", insertData[0].id);
      
      if (deleteError) {
        console.warn("⚠️ Could not clean up test vote:", deleteError);
      } else {
        console.log("✅ Test vote cleaned up");
      }
    }

    return { success: true, message: "All tests passed" };
    
  } catch (error) {
    console.error("❌ Debug test failed:", error);
    return { success: false, error: "Debug test failed", details: error };
  }
}; 