import React, { useState } from "react";
import styles from "./NewsCard.module.css";

const NewsCard = ({ image, title, snippet, url }) => {
  const fallback =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";

  return (
    <div className={styles.newsCard}>
      <img
        src={image || fallback}
        alt={title}
        className={styles.newsImage}
        loading="lazy"
      />

      <div className={styles.newsContent}>
        <h3 className={styles.newsTitle}>{title}</h3>
        <p className={styles.newsSnippet}>{snippet}</p>

        <a
          className={styles.sourceLink}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read more →
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
