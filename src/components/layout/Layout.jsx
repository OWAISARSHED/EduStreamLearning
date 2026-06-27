import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import '../../styles/layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="page-content" id="main-content" role="main" tabIndex={-1}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
