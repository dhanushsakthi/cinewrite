// Research integrations (spec sections 17, 18, 44).
//
// NOT TESTED IN THIS BUILD: this sandbox's network egress is restricted to
// package registries and github — api.themoviedb.org, omdbapi.com, and
// googleapis.com are not reachable from here, so these calls have only been
// verified against API documentation, not exercised live. Get your own free
// keys (TMDB, OMDb) and set TMDB_API_KEY / OMDB_API_KEY in .env before
// relying on this in production — treat it as a first draft to test against
// the real APIs yourself.

async function searchTMDB(query, apiKey) {
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return data.results.map((m) => ({
    source: 'TMDB',
    externalId: String(m.id),
    title: m.title,
    releaseDate: m.release_date,
    overview: m.overview,
    genreIds: m.genre_ids,
    posterPath: m.poster_path,
  }));
}

async function getOMDbDetails(title, apiKey) {
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb error: ${res.status}`);
  const data = await res.json();
  if (data.Response === 'False') return null;
  return {
    source: 'OMDb',
    title: data.Title,
    year: data.Year,
    genre: data.Genre,
    imdbRating: data.imdbRating,
    runtime: data.Runtime,
    plot: data.Plot,
  };
}

async function searchGoogleBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Books error: ${res.status}`);
  const data = await res.json();
  return (data.items || []).map((b) => ({
    source: 'Google Books',
    title: b.volumeInfo.title,
    authors: b.volumeInfo.authors,
    description: b.volumeInfo.description,
    publishedDate: b.volumeInfo.publishedDate,
  }));
}

module.exports = { searchTMDB, getOMDbDetails, searchGoogleBooks };
