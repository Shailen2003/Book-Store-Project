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
let menuIcon = document.querySelector("#menu-icon");
let mobileMenu = document.querySelector("#mobile-menu");
let navLinks = document.querySelectorAll(".navbar a");

// Function to close the mobile menu
function closeMobileMenu() {
  menuIcon.classList.remove("bx-x");
  mobileMenu.classList.add("translate-x-full");
}

// Toggle mobile menu on menu icon click
menuIcon.addEventListener("click", (event) => {
  menuIcon.classList.toggle("bx-x");
  mobileMenu.classList.toggle("translate-x-full");
  event.stopPropagation(); // Prevents immediate closing when clicking menuIcon
});

// Close mobile menu when clicking a menu link (only on small screens)
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      closeMobileMenu();
    }
  });
});

// cart ke liye 
// document.addEventListener("DOMContentLoaded", () => {
//   const cart = JSON.parse(localStorage.getItem("cart")) || [];
  
//   Add to Cart Event Listener
//   document.querySelectorAll(".add-to-cart").forEach(button => {
//       button.addEventListener("click", (event) => {
//           const bookId = event.target.getAttribute("data-id");
//           const title = event.target.getAttribute("data-title");
//           const price = event.target.getAttribute("data-price");

//           const book = { bookId, title, price };

//           Check if item is already in cart
//           const existing = cart.find(item => item.bookId === bookId);
//           if (!existing) {
//               cart.push(book);
//               localStorage.setItem("cart", JSON.stringify(cart));
//               alert(`${title} added to cart!`);
//           } else {
//               alert(`${title} is already in the cart.`);
//           }
//       });
//   });
// });
