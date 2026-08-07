import { Outlet } from 'react-router-dom';
import PublicHeader from '../public/PublicHeader';
import PublicFooter from '../public/PublicFooter';
import './PublicShell.css';

interface PublicShellProps {
  sourceCount?: number;
  conceptCount?: number;
}

export default function PublicShell({ sourceCount, conceptCount }: PublicShellProps) {
  return (
    <div className="public-shell">
      <PublicHeader />
      <main className="public-shell__main">
        <Outlet />
      </main>
      <PublicFooter sourceCount={sourceCount} conceptCount={conceptCount} />
    </div>
  );
}
