import React from "react";
import NewsCard from "./NewsCard";
import styles from "./NewsFeed.module.css";

const NewsFeed = ({ news }) => {
  const articles = Array.isArray(news) ? news : [];

  if (articles.length === 0) {
    return (
      <div className={styles.newsFeedSection}>
        <h2 className={styles.sectionHeader}>Latest Travel Updates</h2>
        <p className={styles.noNews}>No updates found for this location.</p>
      </div>
    );
  }

  // 🔥 Travel-dominant articles (score-based, not position-based)
  const topNews = articles.filter((a) => a._score >= 30); // travel-dominant threshold

  // 📰 Everything else
  const topUrls = new Set(topNews.map((a) => a.url));
  const otherNews = articles.filter((a) => !topUrls.has(a.url));

  return (
    <div className={styles.newsFeedSection}>
      {topNews.length > 0 && (
        <>
          <h2 className={styles.sectionHeader}>Top Travel & Tourism Updates</h2>
          <div className={styles.newsList}>
            {topNews.map((article) => (
              <NewsCard
                key={article.url}
                title={article.title}
                snippet={article.description}
                image={article.urlToImage}
                url={article.url}
              />
            ))}
          </div>
        </>
      )}

      <h2 className={styles.sectionHeader}>More News & Updates</h2>
      <div className={styles.newsList}>
        {otherNews.map((article) => (
          <NewsCard
            key={article.url}
            title={article.title}
            snippet={article.description}
            image={article.urlToImage}
            url={article.url}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
