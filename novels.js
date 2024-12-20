document.addEventListener('DOMContentLoaded', () => { 
    const API_URL = 'http://localhost:3000/books';
    const booksList = document.getElementById('books-list');
    const editFormModal = document.getElementById('edit-form-modal');
    const editBookForm = document.getElementById('edit-book-form');
    const closeEditModalButton = document.getElementById('close-edit-modal');
    const viewDetailsModal = document.getElementById('view-details-modal');
    const closeDetailsModalButton = document.getElementById('close-details-modal');
    const addBookButton = document.getElementById('add-book-button');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-button');
    const noResultsMessage = document.getElementById('no-results');

    let booksData = [];

    // Fetch and Display Books
    const fetchBooks = () => {
        fetch(API_URL)
            .then(response => response.json())
            .then(books => {
                booksData = books;
                displayBooks(books);
            })
            .catch(error => console.error('Error fetching books:', error));
    };

    const displayBooks = (books) => {
        booksList.innerHTML = '';
        if (books.length === 0) {
            noResultsMessage.style.display = 'block';
            return;
        }
        noResultsMessage.style.display = 'none';

        books.forEach((book) => {
            const bookElement = document.createElement('div');
            bookElement.classList.add('book-item');

            // Use placeholder if cover is missing
            
            const coverImage = book.link && isValidUrl(book.link) 
                ? book.link 
                : 'https://via.placeholder.com/150';

            bookElement.innerHTML = `
                <img src="${coverImage}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150';">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Year:</strong> ${book.year || 'Unknown'}</p>
                <div class="actions">
                    <button class="view-details-button" data-id="${book.id}">View Details</button>
                    <button class="edit-button" data-id="${book.id}">Edit</button>
                    <button class="delete-button" data-id="${book.id}">Delete</button>
                </div>
            `;

            // Helper function to validate URLs
            function isValidUrl(string) {
                try {
                    new URL(string);
                    return true;
                } catch (err) {
                    return false;
                }
            }

                        

            // View Details Button
            bookElement.querySelector('.view-details-button').addEventListener('click', () => openDetailsModal(book));

            // Edit Button
            bookElement.querySelector('.edit-button').addEventListener('click', () => openEditModal(book));

            // Delete Button
            bookElement.querySelector('.delete-button').addEventListener('click', () => deleteBook(book.id));

            booksList.appendChild(bookElement);
        });
    };

    const openEditModal = (book = {}) => {
        document.getElementById('book-title').value = book.title || '';
        document.getElementById('book-author').value = book.author || '';
        document.getElementById('book-year').value = book.year || '';
        document.getElementById('book-cover').value = book.cover || '';
        document.getElementById('book-description').value = book.description || '';
        editBookForm.dataset.id = book.id || '';
        editFormModal.style.display = 'flex';
    };

    const openDetailsModal = (book) => {
        document.getElementById('details-title').textContent = book.title;
        document.getElementById('details-author').textContent = book.author;
        document.getElementById('details-year').textContent = book.year || 'Unknown';
        document.getElementById('details-description').textContent = book.description;
        viewDetailsModal.style.display = 'flex';
    };

    const saveBook = (e) => {
        e.preventDefault();
        const bookId = editBookForm.dataset.id;
        const bookData = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            year: parseInt(document.getElementById('book-year').value, 10),
            cover: document.getElementById('book-cover').value,
            description: document.getElementById('book-description').value,
        };
        const method = bookId ? 'PUT' : 'POST';
        const url = bookId ? `${API_URL}/${bookId}` : API_URL;
        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData),
        })
            .then(() => {
                editFormModal.style.display = 'none';
                fetchBooks();
            })
            .catch(error => console.error('Error saving book:', error));
    };

    const deleteBook = (bookId) => {
        fetch(`${API_URL}/${bookId}`, { method: 'DELETE' })
            .then(() => fetchBooks())
            .catch(error => console.error('Error deleting book:', error));
    };

    const filterBooks = () => {
        const query = searchInput.value.toLowerCase();
        const filteredBooks = booksData.filter(
            book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
        );
        displayBooks(filteredBooks);
    };

    const clearSearch = () => {
        searchInput.value = '';
        displayBooks(booksData);
    };

    searchButton.addEventListener('click', filterBooks);
    clearButton.addEventListener('click', clearSearch);
    editBookForm.addEventListener('submit', saveBook);
    closeEditModalButton.addEventListener('click', () => editFormModal.style.display = 'none');
    closeDetailsModalButton.addEventListener('click', () => viewDetailsModal.style.display = 'none');
    addBookButton.addEventListener('click', () => openEditModal());
    fetchBooks();
});
