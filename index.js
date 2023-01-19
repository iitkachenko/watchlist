const moviesElt = document.getElementById('movies');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search');
const watchlistElt = document.getElementById('watchlist');
let watchlist = localStorage.getItem('watchlist') 
                ? JSON.parse(localStorage.getItem('watchlist')) 
                : localStorage.setItem('watchlist', '[]');

if(searchBtn) {
    searchBtn.addEventListener('click', async (e) => {      
        e.preventDefault();
        moviesElt.innerHTML = '';
        const moviesByTitle = await searchMovies(searchInput.value);    

        if (!moviesByTitle) {
            return;
        }
        const movies = await Promise.all(moviesByTitle.Search
            .map(({imdbID}) => getMovieWithDetailes(imdbID)));
        
        renderSearchedMovies(movies);
        
        document.querySelectorAll('.add-btn')
            .forEach(btn => btn.addEventListener('click', (e) => {
            const message = document.getElementById('message');
            
            message.classList.add('show');
            setTimeout(() => message.classList.remove('show'), 500); 
            
            addMovieToWatchlist(e.target.dataset.imdbId);            
        }));
    });
}

async function searchMovies(searchingString) {
  if (searchingString.trim().length < 3) {
      moviesElt.textContent = 'Enter at least 3 letters, please.';
      return false;      
  } 
  const response = await fetch(`https://www.omdbapi.com/?apikey=486971f0&s=${searchingString}`);
  const moviesByTitle = await response.json();
  if (moviesByTitle.Response === "False") {
      console.log(moviesByTitle.Error);
      moviesElt.textContent = 'Unable to find what you’re looking for. Please try another search.';
      return false;
  }
  
//   searchInput.value = '';
          
  return moviesByTitle;
}

async function getMovieWithDetailes(imdbID) {
    const response = await fetch(`https://www.omdbapi.com/?apikey=486971f0&i=${imdbID}&plot=full`);
    const movie = await response.json();  
    
    return movie; 
}

function getMovieCardHtml(movie, btnClass = 'add') {
    const {Title, Year, Runtime, Genre, Plot, Poster, imdbRating, imdbID} =  movie;
    const btnHtml = (btnClass === 'add') 
        ? `<button class="add-btn" data-imdb-id="${imdbID}">Watchlist</button>`
        : `<button class="remove-btn" data-imdb-id="${imdbID}">Remove</button>`;

    let posterImgPath = Poster;
    if (Poster === 'N/A') {
        posterImgPath = './images/movie-placeholder.png';
    }
    return `
        <div class="card">
            <img class="poster" src="${posterImgPath}">
            <div class="card-info">
                <div class="card-title">
                    <h2>${Title}</h2>
                    <span class="rating">${imdbRating}</span>
                </div>
                <div class="card-detailes">
                    <span class="year">${Year}</span>
                    <span class="runtime">${Runtime}</span>
                    <span class="genre">${Genre}</span>
                    ${btnHtml}
                </div>
                <div class="card-plot">
                    <p class="plot">
                        ${Plot}
                    </p>
                </div>
            </div>
        </div>`;
}

function renderSearchedMovies(movies) {
    moviesElt.innerHTML = movies
        .reduce((acc, movie) => acc += getMovieCardHtml(movie), '');
    moviesElt.innerHTML += `<span id="message">Added to watchlist</span>`;
        
    readMoreButton();
    window.addEventListener('resize', readMoreButton);
}

function addMovieToWatchlist(imdbID) {
    watchlist = JSON.parse(localStorage.getItem('watchlist'));
    
    if (!watchlist.includes(imdbID)) {
        watchlist.unshift(imdbID);
    }
    
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function removeMovieFromWatchlist(imdbID) {
    watchlist = JSON.parse(localStorage.getItem('watchlist'));
    if (watchlist.includes(imdbID)) {
        watchlist.splice(watchlist.indexOf(imdbID), 1);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

async function renderWatchlist() {
    if(watchlistElt) {
        watchlist = JSON.parse(localStorage.getItem('watchlist')); 
        if (watchlist.length === 0) {
            watchlistElt.innerHTML = `
                <div class="watchlist-placeholder">
                    <div>Your watchlist is looking a little empty...</div>
                    <a class="add-btn" href="./index.html">Let’s add some movies!</a>
                </div>
            `;
            return;
        }
        const movies = await Promise.all(watchlist
            .map(imdbID => getMovieWithDetailes(imdbID)));  

        watchlistElt.innerHTML = movies
            .reduce((acc, movie) => acc += getMovieCardHtml(movie, 'remove'), '');
            
        document.querySelectorAll('.remove-btn')
            .forEach(btn => btn.addEventListener('click', (e) => {
            removeMovieFromWatchlist(e.target.dataset.imdbId);
        }));
        
        readMoreButton();
        window.addEventListener('resize', readMoreButton);
    } 
}

renderWatchlist();

function readMoreButton() {
    document.querySelectorAll('.plot').forEach(item => {
        const btn = item.parentElement.querySelector('.read-more-btn');
        if (item.scrollHeight > item.clientHeight) {
           if(!btn) {
            item.parentElement.innerHTML += `
                    <button class="read-more-btn">
                        Reed more
                    </button>`;
           }
        } else {
            if(btn && !btn.classList.contains('less')) {
                btn.remove();
           }
        }
    });
    document.querySelectorAll('.read-more-btn').forEach(item => (
        item.onclick = (e) => {
            item.parentElement.classList.toggle('show');
            item.classList.toggle('less');
            item.textContent = item.classList.contains('less') 
                                    ? 'Show less' : 'Read more';
        }
    ))
}
