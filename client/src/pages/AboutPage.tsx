export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-card">
        <div className="about-logo">ZETAtube</div>
        <p className="about-tagline">A full-featured YouTube clone built for learning and demonstration.</p>
        <div className="about-section">
          <h3>Tech Stack</h3>
          <div className="about-tags">
            <span>React</span>
            <span>TypeScript</span>
            <span>Node.js</span>
            <span>Express</span>
            <span>MongoDB</span>
          </div>
        </div>
        <div className="about-section">
          <h3>Features</h3>
          <ul>
            <li>Video upload & playback with custom player</li>
            <li>User authentication & profiles</li>
            <li>Subscriptions & notifications</li>
            <li>Comments with replies</li>
            <li>Playlists & Watch Later</li>
            <li>Search with filters</li>
            <li>Fully responsive design</li>
          </ul>
        </div>
        <div className="about-footer">
          <p>Built by <strong>Shelby__x1</strong></p>
          <p className="copyright">&copy; 2026 All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
