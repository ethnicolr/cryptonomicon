const API_KEY =
    'f8c5d1ad7a09b2836cb4e910ec1a4280f50d0409de79f89a7bd7f01f0bd6b9d0'
const AGGREGATE_INDEX = '5'
const INVALID_SUB = '500'

const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
)
const tickersHandlers = new Map()

// TODO подписка на разных вкладках shared worker

// TODO: urlUseSearchparams
// todo Nanoevents
socket.addEventListener('message', async (e) => {
    let {
        TYPE: type,
        FROMSYMBOL: currency,
        TOSYMBOL: exchange,
        PRICE: newPrice,
        PARAMETER: parameter,
    } = JSON.parse(e.data)

    if (type === INVALID_SUB) {
        [, , currency, exchange] = parameter.split('~')
        if (exchange === 'USD') {
            subscribeToTickerOnWs(currency, 'BTC')
            tickersHandlers.set(currency, {
                ...tickersHandlers.get(currency),
                exchange: 'BTC',
            })
        } else {
            newPrice = null
        }
    } else if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return
    }

    if (exchange === 'BTC' && type === AGGREGATE_INDEX) {
        const response = await fetch(
            `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&api_key=${API_KEY}`
        )
        const { USD: btcRate } = await response.json()
        newPrice = newPrice * btcRate
    }
    const handlers = tickersHandlers.get(currency).cb ?? []
    handlers.forEach((fn) => fn(newPrice))
})

function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message)

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return
    }

    socket.addEventListener(
        'open',
        () => {
            socket.send(stringifiedMessage)
        },
        { once: true }
    )
}

function subscribeToTickerOnWs(ticker, exchange) {
    sendToWebSocket({
        action: 'SubAdd',
        subs: [`5~CCCAGG~${ticker}~${exchange}`],
    })
}

function unsubscribeFromTickerOnWs(ticker, exchange) {
    sendToWebSocket({
        action: 'SubRemove',
        subs: [`5~CCCAGG~${ticker}~${exchange}`],
    })
}

export const subscribeToTicker = (ticker, cb, exchange = 'USD') => {
    const subscribers = tickersHandlers.get(ticker) || { exchange, cb: [] }
    tickersHandlers.set(ticker, { exchange, cb: [...subscribers.cb, cb] })
    subscribeToTickerOnWs(ticker, exchange)
}

export const unsubscribeFromTicker = (ticker) => {
    const { exchange } = tickersHandlers.get(ticker)
    tickersHandlers.delete(ticker)
    unsubscribeFromTickerOnWs(ticker, exchange)
}
