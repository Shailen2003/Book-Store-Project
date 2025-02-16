// Toggle FAQ answer visibility
function toggleFAQ(faqId) {
  let faq = document.getElementById(faqId);
  faq.classList.toggle("hidden");
}

// Toggle the visibility of the answer in the question
function toggleQuestionDetails(button) {
  let questionAnswer = button.closest("li").querySelector("p");
  questionAnswer.classList.toggle("hidden");
}

// Function to handle the reply action
function replyToQuestion(button) {
  let replyText = prompt("Enter your reply:");
  if (replyText) {
    let replyList = button.closest("li").querySelector(".reply-list");
    let reply = document.createElement("li");
    reply.classList.add("text-gray-500", "ml-6", "mt-2");
    reply.textContent = `Reply: ${replyText}`;
    replyList.appendChild(reply);
  }
}

// Function to handle the like/dislike action (like or dislike only, not both)
function toggleLikeDislike(button, action) {
  let parentLi = button.closest("li");
  let likeButton = parentLi.querySelector(".text-blue-500");
  let dislikeButton = parentLi.querySelector(".text-red-500");

  // Reset both buttons to unselected state
  if (action === "like") {
    dislikeButton.disabled = true;
    likeButton.classList.add("text-blue-500");
  } else {
    likeButton.disabled = true;
    dislikeButton.classList.add("text-red-500");
  }

  // Allow only one like/dislike action
  if (action === "like") {
    likeButton.classList.add("text-blue-700");
  } else {
    dislikeButton.classList.add("text-red-700");
  }
}

// Function to handle the user question submission
function submitQuestion() {
  let questionInput = document.getElementById("user-question");
  let questionText = questionInput.value.trim();
  if (questionText !== "") {
    let questionList = document.getElementById("question-list");
    let newQuestion = document.createElement("li");
    newQuestion.classList.add(
      "flex",
      "flex-col",
      "bg-gray-100",
      "p-4",
      "rounded",
      "shadow-md"
    );

    newQuestion.innerHTML = `
            <div class="flex justify-between">
                <p class="font-semibold">${questionText}</p>
                <div class="flex space-x-2">
                    <button class="text-blue-500" onclick="toggleQuestionDetails(this)">Read More</button>
                    <button class="text-blue-500" onclick="replyToQuestion(this)">Reply</button>
                </div>
            </div>
            <p class="text-gray-600 mt-2 hidden">Your question will be answered soon.</p>
            <div class="flex mt-2">
                <button class="text-blue-500 mr-2" onclick="toggleLikeDislike(this, 'like')">👍 Like</button>
                <button class="text-red-500" onclick="toggleLikeDislike(this, 'dislike')">👎 Dislike</button>
            </div>
            <ul class="reply-list mt-2">
                <!-- Replies will go here -->
            </ul>
        `;
    questionList.prepend(newQuestion); // Add the new question at the top
    questionInput.value = "";
  }
}
// Function to toggle the visibility of the additional content of the blog post (Read More/Show Less)
function togglePostDetails(button) {
  let postDetails = button.closest("div").querySelector("p:nth-of-type(2)");
  postDetails.classList.toggle("hidden");
  if (postDetails.classList.contains("hidden")) {
    button.textContent = "Read More";
  } else {
    button.textContent = "Show Less";
  }
}

// Function to handle the user post submission
function submitPost() {
  let nameInput = document.getElementById("user-name").value.trim();
  let postInput = document.getElementById("user-post").value.trim();
  let photoInput = document.getElementById("user-photo").files[0];

  if (nameInput !== "" && postInput !== "") {
    let scrollablePosts = document.getElementById("scrollable-posts");
    let newPost = document.createElement("div");
    newPost.classList.add("bg-gray-100", "p-4", "rounded", "mb-4");

    let imgTag = "";
    if (photoInput) {
      let imgURL = URL.createObjectURL(photoInput);
      imgTag = `<img src="${imgURL}" alt="User Photo" class="w-12 h-12 rounded-full mb-2">`;
    }

    newPost.innerHTML = `
            ${imgTag}
            <p class="font-semibold">${nameInput}</p>
            <p class="text-gray-700">${postInput}</p>
            <button class="text-blue-500 mt-2" onclick="togglePostDetails(this)">Read More</button>
            <p class="text-gray-600 mt-2 hidden">Your feedback will be appreciated by the community!</p>
        `;
    scrollablePosts.appendChild(newPost);

    // Reset the input fields
    document.getElementById("user-name").value = "";
    document.getElementById("user-post").value = "";
    document.getElementById("user-photo").value = "";
  }
}

// Function to handle the "Show More" button click
function toggleBlogPosts() {
  let blogList = document.getElementById("scrollable-posts");
  blogList.classList.toggle("max-h-[300px]"); // Toggle scrollable height
  blogList.classList.toggle("max-h-[600px]"); // Increase height for more posts
  let button = document.querySelector("button[onclick='toggleBlogPosts()']");
  if (blogList.classList.contains("max-h-[600px]")) {
    button.textContent = "Show Less";
  } else {
    button.textContent = "Show More";
  }
}
