import { MessageSquarePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_ROUTES } from '../../constants/routes';
import './ChatFAB.css';

export default function ChatFAB() {
  const navigate = useNavigate();

  return (
    <button
      className="chat-fab"
      onClick={() => navigate(PUBLIC_ROUTES.ASK)}
      aria-label="Start new conversation"
      title="New conversation"
    >
      <MessageSquarePlus size={20} strokeWidth={2} />
    </button>
  );
}
