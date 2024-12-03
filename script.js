window.onload = () => {
    const searchBtn = document.getElementById("searchBtn");
    const input = document.getElementById('titulo');
    const noDataMsg = document.getElementById('noDataFound');
    const landingMsg = document.getElementById('landingMessage');
    const galeriaContainer = document.getElementById('galeriaPeliculas');
    const filterBtn = document.getElementById("filterBtn");
    const reportBtn = document.getElementById('createReport');

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

    let movieData = [];



    /*** MODALS AND FILTERS ***/
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

    /*** INFINITE SCROLL ***/
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

    /*** SEARCHING UTILITIES ***/
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
    
        document.getElementById('loadingGif').style.display = 'block';
    
        try {
            const response = await fetch(url);
            const movies = await response.json();
            handleMoviesResponse(movies, searchTerm, page);
        } catch (err) {
            console.error("Error:", err);
            showErrorState(page);
        } finally {
            document.getElementById('loadingGif').style.display = 'none';
        }
    }
    

    function buildFilterParams() {
        let filterParams = '';
        if (filters.type) filterParams += `&type=${filters.type}`;
        if (filters.year) filterParams += `&y=${filters.year}`;
        if (filters.rating) filterParams += `&rated=${filters.rating}`;
        return filterParams;
    }

    async function handleMoviesResponse(movies, searchTerm, page) {
        if (movies.Response === "True" && Array.isArray(movies.Search)) {
            noDataMsg.style.display = "none";
    
            const fetchDetailsPromises = movies.Search.map(async movie => {
                const details = await fetchMovieDetails(movie.imdbID);
                movieData.push({
                    title: movie.Title,
                    rating: details.rating,
                    votes: details.votes,
                    revenue: details.revenue,
                });
                return movie;
            });
    
            const moviesWithDetails = await Promise.all(fetchDetailsPromises);
    
            moviesWithDetails.forEach(createMovieElement);
    
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

    /*** MOVIES DISPLAY ***/
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
                .then(details => {
                    openModal(movie, details.plot);
                })
                .catch(error => console.error("Error:", error));
        });
    }
    

    async function fetchMovieDetails(imdbID) {
        const url = `${OMDB_API_URL}?apikey=${API_KEY}&i=${imdbID}`;
        const response = await fetch(url);
        const movie = await response.json();
    
        return {
            plot: movie.Plot,
            rating: movie.imdbRating || "N/A",
            votes: movie.imdbVotes || "N/A",
            revenue: movie.BoxOffice || "N/A",
        };
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

    /**REPORT GENERATOR*/
    function generateReport() {
        const sortedByRating = [...movieData].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        const sortedByVotes = [...movieData].sort((a, b) => parseInt(b.votes.replace(/,/g, '')) - parseInt(a.votes.replace(/,/g, '')));
        const sortedByRevenue = [...movieData].sort((a, b) => parseInt(b.revenue.replace(/[\$,]/g, '')) - parseInt(a.revenue.replace(/[\$,]/g, '')));

        const reportModal = createModal('reportModal', 'Reporte');
        const canvas = document.createElement('canvas');
        reportModal.querySelector('.modal-content').appendChild(canvas);

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedByRating.map(movie => movie.title),
                datasets: [
                    {
                        label: 'Ratings',
                        data: sortedByRating.map(movie => movie.rating),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                    {
                        label: 'Votes',
                        data: sortedByVotes.map(movie => parseInt(movie.votes.replace(/,/g, ''))),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                    },
                    {
                        label: 'Revenues',
                        data: sortedByRevenue.map(movie => parseInt(movie.revenue.replace(/[\$,]/g, ''))),
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Informe de Películas',
                    },
                },
            },
        });
    }

    /*** MOVIE MODAL ***/
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

    /*** EVENT LISTENERS ***/
    searchBtn.addEventListener('click', performSearch);


    input.addEventListener('keyup', (e) => {
        const searchTerm = input.value.trim();
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        } else if (searchTerm.length >= 3) {
            performSearch();
        } else {
            hideWelcomePage();
            displayStandarPage();
            clearMovieData();
        }
    });

    document.addEventListener('keydown', (e) => { if (e.key == "Escape") closeModal() })
    filterBtn.addEventListener('click', openFilterModal);
    reportBtn.addEventListener('click', generateReport);


    /*** DISPLAY STANDAR ***/
    function displayStandarPage() {
        galeriaContainer.innerHTML = '';
        noDataMsg.style.display = "block";
    }
    /*** HIDE WELCOME ***/
    function hideWelcomePage() {
        landingMsg.style.display = "none";
    }
    /**CLEAR MOVIE DATA*/
    function clearMovieData(){
        movieData = [];
    }
};
