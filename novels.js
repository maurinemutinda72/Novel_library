// This project will allow the user to search, filter and get descriptions for a novel
document.addEventListener('DOMContentLoaded', function () {
    //  HTML elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-button');
    const booksList = document.getElementById('books-list');
    const noResults = document.getElementById('no-results');
    const bookDetailsModal = document.getElementById('book-details-modal');
    const closeModalButton = document.getElementById('close-modal');
    const favoritesButton = document.getElementById('favorites-button');

    // Favorites array
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Fetch books from the Open Library API
    function fetchBooks(query) {
        const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`;

        fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return response.json();
            })
            .then((data) => {
                const exactMatches = data.docs.filter(
                    (book) => book.title && book.title.toLowerCase() === query.toLowerCase()
                );

                if (exactMatches.length > 0) {
                    displayBooks(exactMatches);
                    noResults.style.display = 'none';
                } else {
                    booksList.innerHTML = '';
                    noResults.style.display = 'block';
                }
            })
            .catch((error) => {
                console.error('Error fetching books:', error);
                booksList.innerHTML = '';
                noResults.style.display = 'block';
            });
    }

    // Display books in the results section
    function displayBooks(books) {
        booksList.innerHTML = '';

        books.forEach((book) => {
            const title = book.title || 'No title available';
            const authors = book.author_name ? book.author_name.join(', ') : 'No author available';
            const publishYear = book.first_publish_year || 'No publish year available';
            const coverImage = book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
                : 'https://via.placeholder.com/120x180.png';

            const bookElement = document.createElement('div');
            bookElement.classList.add('book-item');
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
                    key: book.key,
                })}'>View Details</button>
                <button class="add-to-favorites" data-book='${JSON.stringify({
                    title: title,
                    authors: authors,
                    publishYear: publishYear,
                    coverImage: coverImage,
                })}'>${isFavorite(title) ? 'Remove from Favorites' : 'Add to Favorites'}</button>
            `;

            bookElement.querySelector('.view-details').addEventListener('click', function () {
                openBookDetailsModal(JSON.parse(this.getAttribute('data-book')));
            });

            bookElement.querySelector('.add-to-favorites').addEventListener('click', function () {
                toggleFavorite(JSON.parse(this.getAttribute('data-book')));
            });

            booksList.appendChild(bookElement);
        });
    }

    // Check if a book is already in favorites
    function isFavorite(title) {
        return favorites.some((fav) => fav.title === title);
    }

    // Toggle a book between favorites
    function toggleFavorite(book) {
        if (isFavorite(book.title)) {
            favorites = favorites.filter((fav) => fav.title !== book.title);
            alert('Book removed from favorites!');
        } else {
            favorites.push(book);
            alert('Book added to favorites!');
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));

        if (booksList.innerHTML.includes('Remove from Favorites')) {
            viewFavorites();
        }
    }

    // Open the modal with detailed information about a book
    function openBookDetailsModal(book) {
        const { title, authors, publishYear, coverImage, key } = book;

        document.getElementById('book-title').textContent = title || 'No title available';
        document.getElementById('book-author').textContent = `By ${authors || 'No author available'}`;
        document.getElementById('book-description').textContent = `First Published: ${
            publishYear || 'No publish year available'
        }`;
        document.getElementById('book-cover').src = coverImage || 'https://via.placeholder.com/200x300.png';

        fetch(`https://openlibrary.org${key}.json`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch book details');
                }
                return response.json();
            })
            .then((details) => {
                const summary = details.description
                    ? typeof details.description === 'string'
                        ? details.description
                        : details.description.value
                    : 'No summary available for this book.';
                document.getElementById('book-description').textContent = summary;
            })
            .catch((error) => {
                console.error('Error fetching book details:', error);
                document.getElementById('book-description').textContent = 'Failed to load summary.';
            });

        bookDetailsModal.style.display = 'flex';
    }

    // Display the list of favorite books
    function viewFavorites() {
        if (favorites.length > 0) {
            displayBooks(favorites);
            noResults.style.display = 'none';
        } else {
            booksList.innerHTML = '';
            noResults.style.display = 'block';
            noResults.textContent = 'You have no favorite books yet.';
        }
    }

    // Event listeners
    searchButton.addEventListener('click', () => fetchBooks(searchInput.value.trim()));
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        booksList.innerHTML = '';
        noResults.style.display = 'none';
    });
    favoritesButton.addEventListener('click', viewFavorites);
    closeModalButton.addEventListener('click', () => (bookDetailsModal.style.display = 'none'));
});
