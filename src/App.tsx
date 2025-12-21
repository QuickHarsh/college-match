import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import Matching from "./pages/Matching";
import VideoCall from "./pages/VideoCall";
import Events from "./pages/Events";
import Likes from "./pages/Likes";
import Search from "./pages/Search";
import Connections from "./pages/Connections";
import Chats from "./pages/Chats";
import ChatRoom from "./pages/ChatRoom";
import Clubs from "./pages/Clubs";
import Groups from "./pages/Groups";
import GroupRoom from "./pages/GroupRoom";
import TopNav from "./components/TopNav";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminClubs from "./pages/admin/AdminClubs";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import About from "./pages/About";
import CallInviteListener from "./components/CallInviteListener";
import Wallet from "./pages/Wallet";
import Leaderboard from "./pages/Leaderboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TopNav />
          <CallInviteListener />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<ProfileSetup />} />
            <Route path="/match" element={<Matching />} />
            <Route path="/match/video" element={<VideoCall />} />
            <Route path="/search" element={<Search />} />
            <Route path="/events" element={<Events />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/chat/:matchId" element={<ChatRoom />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:clubId" element={<GroupRoom />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/clubs" element={<AdminClubs />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/about" element={<About />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>

        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
