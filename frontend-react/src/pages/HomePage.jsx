import UploadButton from '../components/UploadButton';
import ReviewForm from '../components/ReviewForm';

export default function HomePage() {
  return (
    <div className="home-page">
      <h1>Oh My Money</h1>
      <UploadButton />
      <ReviewForm />
    </div>
  );
}
