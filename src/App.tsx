import React, { useState, useEffect } from 'react';
import {
  ActiveTool,
  ChatMessage,
  ChatAttachment,
  Conversation,
  UserPreferences,
  SubscriptionPlan,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SubscriptionModal } from './components/SubscriptionModal';
import { FreeLimitExpiredModal } from './components/FreeLimitExpiredModal';
import { SignInModal } from './components/SignInModal';
import { FreeAccessModal } from './components/FreeAccessModal';
import { WebsiteView } from './views/WebsiteView';
import { ChatView } from './views/ChatView';
import { LiveChatView } from './views/LiveChatView';
import { AssignmentSolverView } from './views/AssignmentSolverView';
import { CvResumeBuilderView } from './views/CvResumeBuilderView';
import { TranslatorView } from './views/TranslatorView';
import { DataAnalystView } from './views/DataAnalystView';
import { WritingAssistantView } from './views/WritingAssistantView';
import { MathSolverView } from './views/MathSolverView';
import { DocumentAssistantView } from './views/DocumentAssistantView';
import { BusinessAssistantView } from './views/BusinessAssistantView';
import { JobLeadScannerView } from './views/JobLeadScannerView';
import { SettingsView } from './views/SettingsView';
import {
  callGeminiChat,
  getUserStatus,
  checkoutSubscription,
  cancelSubscription,
} from './services/geminiService';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isFreeLimitExpiredModalOpen, setIsFreeLimitExpiredModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isFreeAccessModalOpen, setIsFreeAccessModalOpen] = useState(false);
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState<number>(25);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // User preferences & Subscription state
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const isOwnerLocally = typeof window !== 'undefined' && localStorage.getItem('testimony_owner_unlocked') === 'true';
    const saved = localStorage.getItem('testimony_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isOwnerLocally) {
          parsed.subscription = {
            plan: 'owner_vip',
            isActive: true,
            isOwner: true,
            autoRenew: true,
          };
        }
        return parsed;
      } catch (e) {}
    }
    return {
      theme: 'dark',
      explanationLevel: 'intermediate',
      preferredTone: 'professional',
      defaultLanguage: 'English',
      subscription: {
        plan: isOwnerLocally ? 'owner_vip' : 'free',
        isActive: isOwnerLocally,
        isOwner: isOwnerLocally,
        autoRenew: false,
      },
    };
  });

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('testimony_conversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const saved = localStorage.getItem('testimony_conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return null;
  });

  // Sync user status and free allowance from server
  useEffect(() => {
    getUserStatus()
      .then((status) => {
        setFreeMessagesRemaining(status.freeMessagesRemaining);
        if (status.isSubscribed) {
          updatePreferences({
            subscription: {
              plan: status.subscriptionPlan,
              isActive: status.isSubscribed,
              expiryDate: status.subscriptionExpiryDate,
              autoRenew: true,
            },
          });
        }
        // If 0 free messages left and not subscribed, automatically prompt expired screen
        if (status.freeMessagesRemaining === 0 && !status.isSubscribed) {
          setIsFreeLimitExpiredModalOpen(true);
        }
      })
      .catch((err) => console.warn('Could not sync user status:', err));

    const handleUsageEvent = (e: any) => {
      if (typeof e.detail?.freeMessagesRemaining === 'number') {
        setFreeMessagesRemaining(e.detail.freeMessagesRemaining);
        if (e.detail.freeMessagesRemaining === 0 && !e.detail.isSubscribed) {
          setIsFreeLimitExpiredModalOpen(true);
        }
      }
      if (e.detail?.isSubscribed) {
        updatePreferences({
          subscription: {
            plan: e.detail.plan || 'monthly',
            isActive: true,
            autoRenew: true,
          },
        });
      }
    };

    window.addEventListener('testimony_usage_update', handleUsageEvent);
    return () => window.removeEventListener('testimony_usage_update', handleUsageEvent);
  }, []);

  // Theme application
  useEffect(() => {
    if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    } else {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0b0f19';
      document.body.style.color = '#f8fafc';
    }
  }, [preferences.theme]);

  // Save preferences
  const updatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem('testimony_preferences', JSON.stringify(next));
      return next;
    });
  };

  // Save conversations
  const saveConversations = (updated: Conversation[]) => {
    setConversations(updated);
    localStorage.setItem('testimony_conversations', JSON.stringify(updated));
  };

  // Get active messages
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversation?.messages || [];

  // Start new chat
  const handleNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      tool: 'chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveConversationId(newId);
    setActiveTool('chat');
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    saveConversations(updated);
    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Clear all chats
  const handleClearAllChats = () => {
    saveConversations([]);
    setActiveConversationId(null);
  };

  const isPro = preferences.subscription.isActive && preferences.subscription.plan !== 'free';

  // Send message in ChatView
  const handleSendMessage = async (
    userPrompt: string,
    toolContext?: string,
    attachments?: ChatAttachment[]
  ) => {
    // Check if free allowance is exhausted on free plan
    if (!isPro && freeMessagesRemaining <= 0) {
      setIsFreeLimitExpiredModalOpen(true);
      return;
    }

    let convId = activeConversationId;
    let currentConv = conversations.find((c) => c.id === convId);

    // If no conversation exists or current is empty with different tool, initialize
    if (!currentConv) {
      convId = 'chat_' + Date.now();
      currentConv = {
        id: convId,
        title: userPrompt.slice(0, 32) + (userPrompt.length > 32 ? '...' : ''),
        tool: activeTool,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (currentConv.messages.length === 0) {
      currentConv.title = userPrompt.slice(0, 32) + (userPrompt.length > 32 ? '...' : '');
    }

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      toolContext,
      attachments,
    };

    const updatedMessages = [...currentConv.messages, userMessage];
    const updatedConv = {
      ...currentConv,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    const newConversations = [
      updatedConv,
      ...conversations.filter((c) => c.id !== updatedConv.id),
    ];
    saveConversations(newConversations);
    setActiveConversationId(convId);

    try {
      setIsChatLoading(true);

      const isLiveChat = activeTool === 'live_chat' || toolContext?.includes('Live');
      const liveInstruction = isLiveChat
        ? `You are Testimony AI in live 1-on-1 spoken conversation mode (like ChatGPT Voice mode). The user is talking directly to you aloud from a distance.
COOL HIGH-INTELLIGENCE PERSONA:
- You have a cool, effortlessly brilliant, and razor-sharp intellect. Speak with calm confidence, intellectual clarity, and authentic charisma.
- Keep spoken responses ultra-fast, snappy, and natural (1 to 2 conversational sentences, max 3) so conversation moves rapidly without delay.
- NEVER output markdown formatting, asterisks, bullet points, headers, numbered lists, code blocks, or URLs.
PROACTIVE POLITE CORRECTION:
- If Testimony makes any factual error, calculation slip, misstatement, or incorrect assumption, calmly, coolly, and constructively correct them with sharp precision and charm. Never just agree with an error. Real brilliance speaks truth with warmth and respect.
- Address Testimony Bassey as an inspiring mentor and peer.`
        : undefined;

      const aiReply = await callGeminiChat(updatedMessages, liveInstruction);

      // Update remaining count returned by server
      if (typeof aiReply.freeMessagesRemaining === 'number') {
        setFreeMessagesRemaining(aiReply.freeMessagesRemaining);
        if (aiReply.freeMessagesRemaining === 0 && !aiReply.isSubscribed) {
          setIsFreeLimitExpiredModalOpen(true);
        }
      }

      const assistantMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: aiReply.text,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConv = {
        ...updatedConv,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      saveConversations([
        finalConv,
        ...conversations.filter((c) => c.id !== finalConv.id),
      ]);
    } catch (err: any) {
      if (err?.isFreeLimitReached) {
        setFreeMessagesRemaining(0);
        setIsFreeLimitExpiredModalOpen(true);
        return;
      }

      console.error('Chat generation error:', err);
      const userFriendlyNotice =
        err?.message?.includes('high demand') || err?.message?.includes('503')
          ? 'The AI model experienced a brief network traffic spike. Please send your message again or click retry.'
          : err?.message || 'Unable to communicate with the assistant. Please try again.';

      const errorMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: `⚠️ **Error generating response:** ${userFriendlyNotice}`,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      const finalConv = {
        ...updatedConv,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      saveConversations([
        finalConv,
        ...conversations.filter((c) => c.id !== finalConv.id),
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Server-verified Subscription upgrade handler ($5/wk, $10/mo, or $250/yr)
  const handleUpgradeSubscription = async (plan: 'weekly' | 'monthly' | 'yearly') => {
    try {
      const updatedUser = await checkoutSubscription(plan);
      updatePreferences({
        subscription: {
          plan: updatedUser.subscriptionPlan,
          isActive: updatedUser.isSubscribed,
          startDate: Date.now(),
          expiryDate: updatedUser.subscriptionExpiryDate,
          autoRenew: true,
          isOwner: updatedUser.isOwner,
        },
      });
      setFreeMessagesRemaining(updatedUser.freeMessagesRemaining);
      setIsFreeLimitExpiredModalOpen(false);
    } catch (err) {
      console.error('Upgrade verification failed:', err);
      throw err;
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const updatedUser = await cancelSubscription();
      updatePreferences({
        subscription: {
          plan: 'free',
          isActive: false,
          autoRenew: false,
        },
      });
      setFreeMessagesRemaining(updatedUser.freeMessagesRemaining);
    } catch (err) {
      console.error('Cancel subscription failed:', err);
      throw err;
    }
  };

  const handleExitFreePlan = () => {
    try {
      localStorage.removeItem('testimony_owner_unlocked');
    } catch (e) {}
    updatePreferences({
      subscription: {
        plan: 'free',
        isActive: false,
        isOwner: false,
        autoRenew: false,
      },
    });
    setFreeMessagesRemaining(25);
    setIsFreeAccessModalOpen(false);
  };

  const isOwnerActive = Boolean(
    preferences.subscription.isOwner || preferences.subscription.plan === 'owner_vip'
  );

  return (
    <div className={`min-h-screen flex flex-col ${preferences.theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0b0f19] text-slate-100'}`}>
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenFreeAccessModal={() => setIsFreeAccessModalOpen(true)}
          isOwner={isOwnerActive}
          onExitFreePlan={handleExitFreePlan}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            activeTool={activeTool}
            theme={preferences.theme}
            onToggleTheme={() =>
              updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })
            }
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
            subscription={preferences.subscription}
            freeMessagesRemaining={freeMessagesRemaining}
            onNavigateLiveChat={() => setActiveTool('live_chat')}
            onOpenFreeAccessModal={() => setIsFreeAccessModalOpen(true)}
            onExitFreePlan={handleExitFreePlan}
          />

          <main className="flex-1 flex flex-col overflow-y-auto">
            {activeTool === 'chat' && (
              <ChatView
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                onNewChat={handleNewChat}
                onNavigateTool={setActiveTool}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
                freeMessagesRemaining={freeMessagesRemaining}
              />
            )}

            {activeTool === 'live_chat' && (
              <LiveChatView
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                onNavigateToStandardChat={() => setActiveTool('chat')}
                isLoading={isChatLoading}
                freeMessagesRemaining={freeMessagesRemaining}
                isPro={isPro}
              />
            )}

            {activeTool === 'job_scanner' && (
              <JobLeadScannerView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'assignment' && (
              <AssignmentSolverView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'cv_builder' && (
              <CvResumeBuilderView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'translator' && (
              <TranslatorView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'data_analyst' && (
              <DataAnalystView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'writing' && (
              <WritingAssistantView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'math' && (
              <MathSolverView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'document' && (
              <DocumentAssistantView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'business' && (
              <BusinessAssistantView
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isPro={isPro}
              />
            )}

            {activeTool === 'settings' && (
              <SettingsView
                preferences={preferences}
                onUpdatePreferences={updatePreferences}
                onClearAllChats={handleClearAllChats}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                freeMessagesRemaining={freeMessagesRemaining}
              />
            )}
          </main>
        </div>
      </div>

      {/* Subscription Plans Modal: $10/month and $250/year */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={preferences.subscription}
        onUpgrade={handleUpgradeSubscription}
        onCancelSubscription={handleCancelSubscription}
      />

      {/* Automatic Free Limit Expired Modal (Triggered on 0 messages) */}
      <FreeLimitExpiredModal
        isOpen={isFreeLimitExpiredModalOpen}
        onUpgradeMyPlan={() => {
          setIsFreeLimitExpiredModalOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
        onViewSubscriptionPlans={() => {
          setIsFreeLimitExpiredModalOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
        onSignIn={() => {
          setIsSignInModalOpen(true);
        }}
        onReturnToMyConversations={() => {
          setIsFreeLimitExpiredModalOpen(false);
          setActiveTool('chat');
        }}
      />

      {/* Account Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignedIn={(status) => {
          setFreeMessagesRemaining(status.freeMessagesRemaining);
          if (status.isSubscribed) {
            updatePreferences({
              subscription: {
                plan: status.subscriptionPlan,
                isActive: true,
                expiryDate: status.subscriptionExpiryDate,
                autoRenew: true,
              },
            });
            setIsFreeLimitExpiredModalOpen(false);
          } else if (status.freeMessagesRemaining > 0) {
            setIsFreeLimitExpiredModalOpen(false);
          }
        }}
      />

      {/* Dedicated 100% Free Owner Platform Access Gate */}
      <FreeAccessModal
        isOpen={isFreeAccessModalOpen}
        onClose={() => setIsFreeAccessModalOpen(false)}
        isUnlocked={isOwnerActive}
        onUnlockedSuccess={() => {
          updatePreferences({
            subscription: {
              plan: 'owner_vip',
              isActive: true,
              isOwner: true,
              autoRenew: true,
            },
          });
          setFreeMessagesRemaining(999999);
          setIsFreeLimitExpiredModalOpen(false);
        }}
        onNavigateToLiveChat={() => setActiveTool('live_chat')}
        onNavigateToChat={() => setActiveTool('chat')}
        onExitFreePlan={handleExitFreePlan}
      />
    </div>
  );
}
