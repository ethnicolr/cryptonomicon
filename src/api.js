const API_KEY =
    'f8c5d1ad7a09b2836cb4e910ec1a4280f50d0409de79f89a7bd7f01f0bd6b9d0'

// TODO подписка на разных вкладках

// TODO: urlUseSearchparams
// todo Nanoevents
export const loadTicker = (tickers) =>
    fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tickers.join(
            ','
        )}&tsyms=USD&api_key=${API_KEY}`
    ).then((r) => r.json())
