window.onload = () => {
    const searchBtn = document.getElementById("searchBtn");
    const input = document.getElementById('titulo');
    const noDataMsg = document.getElementById('noDataFound');
    const landingMsg = document.getElementById('landingMessage');
    const galeriaContainer = document.getElementById('galeriaPeliculas');
    const filterBtn = document.getElementById("filterBtn");
    
    const API_KEY = "54349e1c";
    const OMDB_API_URL = "https://www.omdbapi.com/";
    
    let isSearching = false;
    let currentPage = 1;
    let currentSearch = '';
    let filters = {
        type: '',
        year: '',
        rating: ''
    };


    function openFilterModal() {
        const modal = createModal('filterModal', 'Filtrar Resultados');
        const filterContent = `
            <select id="typeFilter">
                <option value="">Todos los tipos</option>
                <option value="movie">Peliculas</option>
                <option value="series">Series</option>
                <option value="episode">Episodios</option>
            </select>
            <input type="number" id="yearFilter" placeholder="Año">
            <select id="ratingFilter">
                <option value="">Ratings</option>
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
            </select>
            <div class="filterModalButtonContainer">
                <button id="applyFilters" class="filterModalBtn">Aplicar Filtros</button>
                <button id="clearFilters" class="filterModalBtn">Borrar Filtros</button>
            </div>
        `;
        modal.querySelector('.modal-content').insertAdjacentHTML('beforeend', filterContent);

        document.getElementById('applyFilters').addEventListener('click', applyFilters);
        document.getElementById('clearFilters').addEventListener('click', clearFilters);
    }

    function applyFilters() {
        filters.type = document.getElementById('typeFilter').value;
        filters.year = document.getElementById('yearFilter').value;
        filters.rating = document.getElementById('ratingFilter').value;
        closeModal();
        performSearch();
    }

    function clearFilters() {
        filters = { type: '', year: '', rating: '' };
        document.getElementById('typeFilter').value = '';
        document.getElementById('yearFilter').value = '';
        document.getElementById('ratingFilter').value = '';
    }

    function closeModal() {
        document.querySelector('.modal').remove();
        document.body.classList.remove('modal-open');
    }

    function setupInfiniteScroll(searchTerm) {
        currentPage = 1;
        currentSearch = searchTerm;
        window.addEventListener('scroll', handleScroll);
    }

    function handleScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 150 && !isSearching) {
            loadMoreMovies();
        }
    }

    function loadMoreMovies() {
        if (currentSearch) {
            currentPage++;
            isSearching = true;
            fetchMovies(currentSearch, currentPage);
        }
    }

    function performSearch() {
        const searchTerm = input.value.trim();
        if (searchTerm && !isSearching) {
            isSearching = true;
            galeriaContainer.innerHTML = ''; 
            noDataMsg.style.display = "none";  
            landingMsg.style.display = "none";
            fetchMovies(searchTerm);
        }
    }

    async function fetchMovies(searchTerm, page = 1) {
        const filterParams = buildFilterParams();
        const url = `${OMDB_API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}${filterParams}&page=${page}`;

        try {
            const response = await fetch(url);
            const movies = await response.json();
            handleMoviesResponse(movies, searchTerm, page);
        } catch (err) {
            console.error("Error:", err);
            showErrorState(page);
        }
    }

    function buildFilterParams() {
        let filterParams = '';
        if (filters.type) filterParams += `&type=${filters.type}`;
        if (filters.year) filterParams += `&y=${filters.year}`;
        if (filters.rating) filterParams += `&rated=${filters.rating}`;
        return filterParams;
    }

    function handleMoviesResponse(movies, searchTerm, page) {
        if (movies.Response === "True" && Array.isArray(movies.Search)) {
            noDataMsg.style.display = "none";
            const filteredMovies = movies.Search.filter(movie => !filters.rating || movie.Rated === filters.rating);
            filteredMovies.forEach(createMovieElement);
            if (page === 1) {
                setupInfiniteScroll(searchTerm);
            }
        } else {
            showErrorState(page);
        }
        isSearching = false;
    }

    function showErrorState(page) {
        noDataMsg.style.display = "block";
        if (page === 1) {
            galeriaContainer.innerHTML = '';
        }
        isSearching = false;
    }

    function createMovieElement(movie) {
        const proyectoContainer = document.createElement('div');
        proyectoContainer.className = "proyecto";
        const imgProyecto = document.createElement("img");
        imgProyecto.src = movie.Poster !== "N/A" ? movie.Poster : './assets/placeholder.jpg';
        imgProyecto.alt = movie.Title;
        proyectoContainer.appendChild(imgProyecto);
        galeriaContainer.appendChild(proyectoContainer);

        proyectoContainer.addEventListener('click', () => {
            fetchMovieDetails(movie.imdbID)
                .then(plot => openModal(movie, plot))
                .catch(error => console.error("Error:", error));
        });
    }

    async function fetchMovieDetails(imdbID) {
        const url = `${OMDB_API_URL}?apikey=${API_KEY}&i=${imdbID}`;
        const response = await fetch(url);
        const movie = await response.json();
        return movie.Plot;
    }

    function openModal(movie, plot) {
        const modal = createModal('movieModal', movie.Title);
        const movieContent = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : './assets/placeholder.jpg'}" alt="${movie.Title}">
            <p><strong>Year:</strong> ${movie.Year}</p>
            <p><strong>Plot:</strong> ${plot}</p>
            <p><strong>Type:</strong> ${movie.Type}</p>
        `;
        modal.querySelector('.modal-content').insertAdjacentHTML('beforeend', movieContent);
    }

    // Create modal element
    function createModal(id, title) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = closeModal;

        const modalTitle = document.createElement('h2');
        modalTitle.textContent = title;

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(modalTitle);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        document.body.classList.add('modal-open');
        return modal;
    }

    searchBtn.addEventListener('click', performSearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });

    filterBtn.addEventListener('click', openFilterModal);
};
