/**
 * Bird Article Functionality
 * Handles the display and navigation of bird article content
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Bird articles script loaded");

  // Add debug logging for DOM elements
  console.log(
    "Article links found:",
    document.querySelectorAll('a[href="#"]').length
  );
  console.log(
    "Article content container:",
    document.getElementById("articleContent")
  );

  // Explicitly add event listeners to all read article links
  const readArticleLinks = document.querySelectorAll(
    '.read-article-link, a[href="#"]'
  );
  console.log("Read article links found:", readArticleLinks.length);

  readArticleLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Article link clicked");

      // Get article ID either from data attribute or from parent article
      let articleId = this.getAttribute("data-article-id");

      if (!articleId) {
        const article = this.closest("article");
        if (article) {
          articleId = article.getAttribute("data-article-id");
          if (!articleId) {
            // Fallback to getting ID from title
            const title = article.querySelector("h3")?.textContent.trim();
            console.log("Article title:", title);

            if (title === "Getting Started with Bird Watching") {
              articleId = "getting-started-article";
            } else if (title === "Bird Identification Tips for Beginners") {
              articleId = "bird-identification-article";
            } else if (title === "Bird Photography Fundamentals") {
              articleId = "bird-photography-article";
            } else {
              // Default fallback
              articleId = "getting-started-article";
            }
          }
        } else {
          // Default fallback
          articleId = "getting-started-article";
        }
      }

      console.log("Showing article with ID:", articleId);
      showArticleContent(articleId);
    });
  });

  // Also handle feature guide links
  const featureLinks = document.querySelectorAll(".feature-link");
  console.log("Feature links found:", featureLinks.length);

  featureLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Feature link clicked");

      // Get article ID from data attribute or use default
      const articleId = this.getAttribute("data-article-id");
      console.log("Opening featured guide with ID:", articleId);

      if (articleId) {
        showArticleContent(articleId);
      } else {
        console.error("No article ID found for this feature link");
        // Default fallback
        showArticleContent("getting-started-article");
      }
    });
  });

  // Function to show specific article content
  function showArticleContent(articleId) {
    console.log("showArticleContent called for:", articleId);

    // IMPORTANT: First hide the home section completely
    const homeSection = document.querySelector("#Home");
    if (homeSection) {
      homeSection.style.display = "none";
      console.log("Main content (Home section) hidden");
    } else {
      console.error("Home section not found");
      return; // Exit if we can't find the home section
    }

    // Then show the article content container
    const articleContent = document.getElementById("articleContent");
    if (articleContent) {
      // Make sure it's visible and has appropriate styling
      articleContent.classList.remove("hidden");
      articleContent.style.display = "block";
      console.log("Article content container shown");

      // Hide all articles within the container
      const allArticles = articleContent.querySelectorAll("article");
      console.log("Articles in container:", allArticles.length);

      allArticles.forEach((art) => {
        art.style.display = "none";
        console.log("Hidden article:", art.id);
      });

      // Show the requested article
      const targetArticle = document.getElementById(articleId);
      if (targetArticle) {
        targetArticle.style.display = "block";
        console.log("Showing target article:", articleId);
      } else {
        console.error("Target article not found:", articleId);
        // If article doesn't exist, show the first one as fallback
        if (allArticles.length > 0) {
          allArticles[0].style.display = "block";
          console.log("Showing first article as fallback");
        }
      }

      // Add a back button at the top if it doesn't exist yet
      if (!document.getElementById("backToHome")) {
        const backButton = document.createElement("button");
        backButton.id = "backToHome";
        backButton.innerHTML = "&larr; Back to Home";
        backButton.className =
          "mb-4 text-green-600 hover:text-green-800 font-medium";
        backButton.addEventListener("click", function () {
          // Hide article content
          articleContent.classList.add("hidden");
          articleContent.style.display = "none";
          // Show main content
          homeSection.style.display = "block";
          // Remove the back button
          this.remove();
          console.log("Returned to home");
        });

        articleContent.insertBefore(backButton, articleContent.firstChild);
        console.log("Back button added");
      }

      // Scroll to top
      window.scrollTo(0, 0);
    } else {
      console.error("Article content container not found");
      homeSection.style.display = "block"; // Restore home section if article content not found
    }
  }
});
