// Add this JavaScript to display full articles when clicked
document.addEventListener("DOMContentLoaded", () => {
  // Get all article links on the home page
  const articleLinks = document.querySelectorAll(
    '#birdSpottingArticles a[href="#"]'
  );

  // Modal elements
  const modalContainer = document.createElement("div");
  modalContainer.className =
    "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden";
  modalContainer.id = "articleModal";

  const modalContent = document.createElement("div");
  modalContent.className =
    "bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4";

  const modalHeader = document.createElement("div");
  modalHeader.className =
    "sticky top-0 bg-white border-b p-4 flex justify-between items-center";

  const closeButton = document.createElement("button");
  closeButton.className =
    "text-gray-500 hover:text-gray-700 focus:outline-none";
  closeButton.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
  closeButton.addEventListener("click", () => {
    modalContainer.classList.add("hidden");
    document.body.style.overflow = "auto";
  });

  const modalBody = document.createElement("div");
  modalBody.className = "p-6";

  // Assemble modal
  modalHeader.appendChild(closeButton);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);

  // Click event for articles
  articleLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Get the article title
      const articleTitle = link
        .closest("article")
        .querySelector("h3").textContent;

      // Find the appropriate article content based on title
      let articleContent = "";

      if (articleTitle.includes("Getting Started")) {
        articleContent = document.getElementById(
          "getting-started-article"
        ).innerHTML;
      } else if (articleTitle.includes("Bird Identification")) {
        // For this example, we'll reuse the first article content
        // In a real implementation, you'd have unique content for each article
        articleContent = document
          .getElementById("getting-started-article")
          .innerHTML.replace(
            "Getting Started with Bird Watching",
            "Bird Identification Tips for Beginners"
          );
      } else if (articleTitle.includes("Photography")) {
        articleContent = document
          .getElementById("getting-started-article")
          .innerHTML.replace(
            "Getting Started with Bird Watching",
            "Bird Photography Fundamentals"
          );
      } else if (articleTitle.includes("Migration")) {
        articleContent = document
          .getElementById("getting-started-article")
          .innerHTML.replace(
            "Getting Started with Bird Watching",
            "Seasonal Bird Migration Guide"
          );
      } else if (articleTitle.includes("Journal")) {
        articleContent = document
          .getElementById("getting-started-article")
          .innerHTML.replace(
            "Getting Started with Bird Watching",
            "Creating Your Bird Watching Journal"
          );
      }

      // Set modal content
      modalBody.innerHTML = articleContent;
      modalHeader.insertAdjacentHTML(
        "afterbegin",
        `<h2 class="text-xl font-bold">${articleTitle}</h2>`
      );

      // Show modal
      modalContainer.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
  });

  // Close modal when clicking outside
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) {
      modalContainer.classList.add("hidden");
      document.body.style.overflow = "auto";
    }
  });
});
