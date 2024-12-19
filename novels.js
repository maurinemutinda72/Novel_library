// Wait for the DOM to fully load before executing any script
document.addEventListener('DOMContentLoaded', function () {
    // Get references to key HTML elements
    const searchInput = document.getElementById('search-input'); // The input field for search queries
    const searchButton = document.getElementById('search-button'); // The button to initiate search
    const clearButton = document.getElementById('clear-button'); // The button to clear search input and results
    const booksList = document.getElementById('books-list'); // The section to display book results
    const noResults = document.getElementById('no-results'); // The message displayed when no books are found
    const bookDetailsModal = document.getElementById('book-details-modal'); // The modal to display detailed book info
    const closeModalButton = document.getElementById('close-modal'); // Button to close the modal
    const favoritesButton = document.getElementById('favorites-button'); // Button to view favorites

    // Favorites array to store favorite books, loaded from localStorage
    let favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Retrieve favorites or initialize as an empty array

    /**
     * Fetch books from the Open Library API based on the user's query
     * @param {string} query - The search term entered by the user
     */
    function fetchBooks(query) {
        const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`; // Construct the API URL with the search query

        // Make a GET request to fetch books
        fetch(apiUrl)
            .then((response) => {
                // Check if the response is valid
                if (!response.ok) {
                    throw new Error('Failed to fetch data'); // Handle fetch error
                }
                return response.json(); // Convert the response to JSON
            })
            .then((data) => {
                // Filter results for exact title matches
                const exactMatches = data.docs.filter(
                    (book) => book.title && book.title.toLowerCase() === query.toLowerCase() // Match titles case-insensitively
                );

                // If matches are found, display them, otherwise show "No results"
                if (exactMatches.length > 0) {
                    displayBooks(exactMatches); // Display matched books
                    noResults.style.display = 'none'; // Hide "No results" message
                } else {
                    booksList.innerHTML = ''; // Clear book list
                    noResults.style.display = 'block'; // Show "No results" message
                }
            })
            .catch((error) => {
                console.error('Error fetching books:', error); // Log errors to console
                booksList.innerHTML = ''; // Clear book list
                noResults.style.display = 'block'; // Show "No results" message
            });
    }

    /**
     * Display books in the results section
     * @param {Array} books - Array of book objects to display
     */
    function displayBooks(books) {
        booksList.innerHTML = ''; // Clear previous results

        // Loop through each book and create a card for it
        books.forEach((book) => {
            const title = book.title || 'No title available'; // Book title
            const authors = book.author_name ? book.author_name.join(', ') : 'No author available'; // Authors
            const publishYear = book.first_publish_year || 'No publish year available'; // Publish year
            const coverImage = book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                : 'https://via.placeholder.com/120x180.png'; // Book cover or placeholder

            // Create a book card element
            const bookElement = document.createElement('div');
            bookElement.classList.add('book-item'); // Add styling class
            bookElement.innerHTML = `
                <img src="${coverImage}" alt="${title}" /> 
                <h3>${title}</h3>
                <p>By ${authors}</p>
                <p>Published: ${publishYear}</p>
                <button class="view-details" data-book='${JSON.stringify({
                    title: title,
                    authors: authors,
                    publishYear: publishYear,
                    coverImage: coverImage,
                    key: book.key, // Add book key for detailed API request
                })}'>View Details</button>
                <button class="add-to-favorites" data-book='${JSON.stringify({
                    title: title,
                    authors: authors,
                    publishYear: publishYear,
                    coverImage: coverImage,
                })}'>${isFavorite(title) ? 'Remove from Favorites' : 'Add to Favorites'}</button>
            `;

            // Add "View Details" button functionality
            bookElement.querySelector('.view-details').addEventListener('click', function () {
                openBookDetailsModal(JSON.parse(this.getAttribute('data-book'))); // Open details modal with book info
            });

            // Add "Add to Favorites" button functionality
            bookElement.querySelector('.add-to-favorites').addEventListener('click', function () {
                toggleFavorite(JSON.parse(this.getAttribute('data-book'))); // Toggle favorite status for the book
            });

            booksList.appendChild(bookElement); // Append book card to results section
        });
    }

    /**
     * Check if a book is already in favorites
     * @param {string} title - Title of the book
     * @returns {boolean} - True if book is in favorites, otherwise false
     */
    function isFavorite(title) {
        return favorites.some((fav) => fav.title === title); // Check if the book title exists in the favorites list
    }

    /**
     * Toggle a book between favorites and remove from favorites
     * @param {Object} book - Book object to toggle
     */
    function toggleFavorite(book) {
        if (isFavorite(book.title)) {
            // Remove book from favorites
            favorites = favorites.filter((fav) => fav.title !== book.title); // Remove from array
            alert('Book removed from favorites!'); // Notify user
        } else {
            // Add book to favorites
            favorites.push(book); // Add to array
            alert('Book added to favorites!'); // Notify user
        }

        // Save updated favorites to localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites)); // Update localStorage

        // If viewing favorites, refresh the list
        if (booksList.innerHTML.includes('Remove from Favorites')) {
            viewFavorites(); // Refresh favorites view if needed
        }
    }

    /**
     * Open the modal with detailed information about a book
     * @param {Object} book - Book object containing basic details
     */
    function openBookDetailsModal(book) {
        const { title, authors, publishYear, coverImage, key } = book; // Destructure book details

        // Set basic details in the modal
        document.getElementById('book-title').textContent = title || 'No title available'; // Set title
        document.getElementById('book-author').textContent = `By ${authors || 'No author available'}`; // Set authors
        document.getElementById('book-description').textContent = `First Published: ${
            publishYear || 'No publish year available'
        }`; // Set publish year
        document.getElementById('book-cover').src = coverImage || 'https://via.placeholder.com/200x300.png'; // Set cover image

        // Fetch additional details (e.g., summary) using the book's key
        fetch(`https://openlibrary.org${key}.json`) // API request for book details
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch book details'); // Handle fetch error
                }
                return response.json(); // Convert response to JSON
            })
            .then((details) => {
                const summary = details.description
                    ? typeof details.description === 'string'
                        ? details.description
                        : details.description.value // Get summary if available
                    : 'No summary available for this book.'; // Fallback if no summary exists
                document.getElementById('book-description').textContent = summary; // Update modal with fetched summary
            })
            .catch((error) => {
                console.error('Error fetching book details:', error); // Log error to console
                document.getElementById('book-description').textContent = 'Failed to load summary.'; // Notify user
            });

        // Show the modal
        bookDetailsModal.style.display = 'flex'; // Display modal
    }

    /**
     * Display the list of favorite books
     */
    function viewFavorites() {
        if (favorites.length > 0) {
            displayBooks(favorites); // Display favorites
            noResults.style.display = 'none'; // Hide "No results" message
        } else {
            booksList.innerHTML = ''; // Clear book list
            noResults.style.display = 'block'; // Show "No results" message
            noResults.textContent = 'You have no favorite books yet.'; // Update message
        }
    }

    // Event listeners
    searchButton.addEventListener('click', () => fetchBooks(searchInput.value.trim())); // Search books
    clearButton.addEventListener('click', () => {
        searchInput.value = ''; // Clear search input
        booksList.innerHTML = ''; // Clear results
        noResults.style.display = 'none'; // Hide "No results" message
    });
    favoritesButton.addEventListener('click', viewFavorites); // View favorites
    closeModalButton.addEventListener('click', () => (bookDetailsModal.style.display = 'none')); // Close modal
});
