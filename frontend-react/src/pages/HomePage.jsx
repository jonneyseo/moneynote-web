import { useState } from 'react';
import UploadButton from '../components/UploadButton';
import ReviewForm from '../components/ReviewForm';
import HistoryPage from './HistoryPage';

export default function HomePage() {
  const [view, setView] = useState('upload');

  return (
    <div className="home-page">
      <h1>Oh My Money</h1>

      <div className="tabs">
        <button
          className={`tab-btn${view === 'upload' ? ' active' : ''}`}
          onClick={() => setView('upload')}
        >
          Upload
        </button>
        <button
          className={`tab-btn${view === 'history' ? ' active' : ''}`}
          onClick={() => setView('history')}
        >
          History
        </button>
      </div>

      {view === 'upload' ? (
        <div className="upload-view">
          <UploadButton />
          <ReviewForm />
        </div>
      ) : (
        <HistoryPage />
      )}
    </div>
  );
}
